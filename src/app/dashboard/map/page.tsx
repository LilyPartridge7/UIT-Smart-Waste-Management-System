"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Layers } from 'lucide-react';
import { API_URL } from '@/lib/config';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as THREE from 'three';

// ── Constants ──────────────────────────────────────────────────────
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_DEFAULT_PUBLIC_TOKEN';
const UIT_CENTER: [number, number] = [96.1354, 16.8559]; // Parami Rd, Hlaing, Yangon
const UIT_TEAL = 0x008080;
const RED_ALERT = 0xff0044;

// Geometry (metres)
const BL = 55, BD = 14, FH = 4, NF = 6;
const BH = NF * FH;          // 24 m
const BSMT_H = 4;
const CO = 32;                // centre → building-centre offset
const CANOPY_ALT = 40;
const CANOPY_SPAN = 110;

// Building positions [x, z] from campus centre
const BPOS: [number, number][] = [[-CO, -CO], [CO, -CO], [-CO, CO], [CO, CO]];
// Inward-facing BoxGeometry material indices per building (+X=0,-X=1,+Y=2,-Y=3,+Z=4,-Z=5)
const INWARD: [number, number][] = [[0, 4], [1, 4], [0, 5], [1, 5]];
// Z-direction towards courtyard for each building
const FRONT_Z = [1, 1, -1, -1];

// ── X-Notation Logic ───────────────────────────────────────────────
class CampusLogicManager {
    static getRoomInformation(nodeId: string) {
        if (nodeId.toLowerCase().includes('basement') || nodeId.toLowerCase().includes('canteen')) {
            return { valid: true, text: 'Basement : Canteen & Parking areas' };
        }
        if (nodeId.toLowerCase().includes('parking')) {
            return { valid: true, text: 'Basement : Parking Zone' };
        }
        const s = nodeId.toString();
        if (s.length !== 3 || isNaN(parseInt(s))) return { valid: false, text: 'Invalid X-Notation' };
        const B = parseInt(s[0]), L = parseInt(s[1]), R = parseInt(s[2]);
        if (L === 1) {
            if (B === 1) return { valid: true, text: `B${B} – L1 : Main Hall` };
            if (B === 2) return { valid: true, text: `B${B} – L1 : Student Affairs & Accounting` };
            if (B === 3) return { valid: true, text: `B${B} – L1 : Library & Meeting Room` };
            if (B === 4) return { valid: true, text: `B${B} – L1 : Computer Lab` };
        }
        if (L === 2 && (B === 1 || B === 2)) {
            return { valid: true, text: `B${B} – L2 : Theatre Corridor (Front-Side Entry)` };
        }
        if (L >= 3 && L <= 6) {
            const pos = R === 2 ? ' (Front Side)' : R === 5 ? ' (Behind Side)' : '';
            return { valid: true, text: `B${B} – L${L} : Near Room ${nodeId}${pos}` };
        }
        return { valid: true, text: `B${B} – L${L} : Near Room ${nodeId}` };
    }
}

// ── Component ──────────────────────────────────────────────────────
export default function MapPage() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [mapObj, setMapObj] = useState<mapboxgl.Map | null>(null);
    const [bins, setBins] = useState<any[]>([]);
    const [activeFloor, setActiveFloor] = useState("ALL");
    const [activeBuilding, setActiveBuilding] = useState("");
    const [appliedFloor, setAppliedFloor] = useState("ALL");
    const [appliedBuilding, setAppliedBuilding] = useState("");
    const [selectedRoomText, setSelectedRoomText] = useState("None");
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const customLayerRef = useRef<any>(null);

    // Fetch bins
    useEffect(() => {
        fetch(`${API_URL}/fetch_map_bins.php`)
            .then(r => r.json())
            .then(d => { if (d?.success) setBins(d.bins); })
            .catch(e => console.error("Failed to fetch bins:", e));
    }, []);

    // ── Map + Three.js initialisation ──
    const mapInitialized = useRef(false);

    useEffect(() => {
        if (!mapContainerRef.current || mapInitialized.current) return;
        mapInitialized.current = true;

        mapboxgl.accessToken = MAPBOX_TOKEN;
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [UIT_CENTER[0], UIT_CENTER[1]],
            zoom: 18, pitch: 65, bearing: -15, antialias: true,
        });

        /* ── Three.js custom layer ── */
        const layer = {
            id: '3d-buildings',
            type: 'custom' as const,
            renderingMode: '3d' as const,
            camera: new THREE.Camera(),
            scene: new THREE.Scene(),
            raycaster: new THREE.Raycaster(),
            mouse: new THREE.Vector2(),
            interactableRooms: [] as THREE.Mesh[],
            alertBins: [] as THREE.Mesh[],
            campusGroup: null as THREE.Group | null,
            renderer: null as THREE.WebGLRenderer | null,
            floorGroups: {} as Record<string, THREE.Group[]>,
            solarGroup: null as THREE.Group | null,
            basementGroup: null as THREE.Group | null,

            // ────── onAdd ──────
            onAdd(mapI: mapboxgl.Map, gl: WebGLRenderingContext) {
                this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
                const sun = new THREE.DirectionalLight(0xffffff, 1.4);
                sun.position.set(200, 500, 300).normalize();
                this.scene.add(sun);
                const fill = new THREE.DirectionalLight(0xaaccff, 0.4);
                fill.position.set(-100, 200, -100).normalize();
                this.scene.add(fill);

                this.buildCampus(mapI);
                this.wireClicks(mapI);

                this.renderer = new THREE.WebGLRenderer({ canvas: mapI.getCanvas(), context: gl, antialias: true });
                this.renderer.autoClear = false;
            },

            // ────── Build full campus ──────
            buildCampus(mapI: mapboxgl.Map) {
                const mc = mapboxgl.MercatorCoordinate.fromLngLat({ lng: UIT_CENTER[0], lat: UIT_CENTER[1] }, 0);
                const s = mc.meterInMercatorCoordinateUnits();
                const cg = new THREE.Group();
                cg.position.set(mc.x, mc.y, mc.z as number);
                cg.scale.set(s, s, s);
                cg.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
                this.scene.add(cg);
                this.campusGroup = cg;

                // ── Materials ──
                const concMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.8, metalness: 0.1 });
                const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x88ccdd, transparent: true, opacity: 0.32, metalness: 0.3, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide });
                const steelMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.85, roughness: 0.3 });
                const louverMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.2, roughness: 0.5 });
                const roomMat = new THREE.MeshStandardMaterial({ color: UIT_TEAL, emissive: 0x004444, emissiveIntensity: 0.4, transparent: true, opacity: 0.7 });
                const solarMat = new THREE.MeshPhysicalMaterial({ color: 0x2244aa, transparent: true, opacity: 0.22, metalness: 0.5, roughness: 0.2, depthWrite: false, side: THREE.DoubleSide });
                const alertMat = new THREE.MeshStandardMaterial({ color: RED_ALERT, emissive: RED_ALERT, emissiveIntensity: 0.5 });
                const landmarkMat = new THREE.MeshStandardMaterial({ color: 0x009999, emissive: 0x005555, emissiveIntensity: 0.3, transparent: true, opacity: 0.8 });
                const basementMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, metalness: 0.05 });

                // ── Shared geometries ──
                const louverGeo = new THREE.BoxGeometry(0.15, FH * 0.75, 0.08);
                const roomGeo = new THREE.BoxGeometry(7, 1.2, 4);
                const colGeo = new THREE.BoxGeometry(0.5, FH - 0.3, 0.5);

                // ── 1. BASEMENT ──
                const bmtG = new THREE.Group();
                const bmtSlab = new THREE.Mesh(new THREE.BoxGeometry(CO * 2 + BL, BSMT_H, CO * 2 + BD), basementMat);
                bmtSlab.position.set(0, -BSMT_H / 2, 0);
                bmtSlab.userData = { type: 'basement', level: 'basement' };
                bmtG.add(bmtSlab);

                // Canteen zone (south half)
                const canteenNode = new THREE.Mesh(new THREE.BoxGeometry(40, 1, 30), roomMat);
                canteenNode.position.set(0, -BSMT_H + 0.5, 20);
                canteenNode.userData = { isRoomNode: true, nodeId: 'canteen', level: 'basement', building: 0 };
                bmtG.add(canteenNode);
                this.interactableRooms.push(canteenNode);

                // Parking zone (north half)
                const parkNode = new THREE.Mesh(new THREE.BoxGeometry(40, 1, 30), roomMat);
                parkNode.position.set(0, -BSMT_H + 0.5, -20);
                parkNode.userData = { isRoomNode: true, nodeId: 'parking', level: 'basement', building: 0 };
                bmtG.add(parkNode);
                this.interactableRooms.push(parkNode);

                this.basementGroup = bmtG;
                cg.add(bmtG);

                // ── 2. FOUR BUILDINGS ──
                for (let bi = 0; bi < 4; bi++) {
                    const bId = bi + 1;
                    const [bx, bz] = BPOS[bi];
                    const bGrp = new THREE.Group();
                    bGrp.position.set(bx, 0, bz);

                    for (let fi = 0; fi < NF; fi++) {
                        const lvl = fi + 1;
                        const fGrp = new THREE.Group();
                        fGrp.position.set(0, fi * FH, 0);

                        // Floor slab (extended → balcony band)
                        const slab = new THREE.Mesh(new THREE.BoxGeometry(BL + 1.2, 0.28, BD + 1.2), concMat);
                        slab.position.set(0, 0.14, 0);
                        slab.userData = { building: bId, level: lvl, type: 'slab' };
                        fGrp.add(slab);

                        // Wall volume (inset to create recessed bands)
                        const wallH = FH - 0.3;
                        const wallGeo = new THREE.BoxGeometry(BL - 0.8, wallH, BD - 0.8);
                        const mats: THREE.Material[] = Array(6).fill(concMat);
                        mats[INWARD[bi][0]] = glassMat;
                        mats[INWARD[bi][1]] = glassMat;
                        const wallMesh = new THREE.Mesh(wallGeo, mats);
                        wallMesh.position.set(0, 0.3 + wallH / 2, 0);
                        wallMesh.userData = { building: bId, level: lvl, type: 'wall' };
                        fGrp.add(wallMesh);

                        // Concrete frame columns on glass faces (3 per long face, 2 per short face)
                        const addColumns = (face: number) => {
                            const isLongFace = (face === 4 || face === 5);
                            const count = isLongFace ? 5 : 2;
                            const span = isLongFace ? BL - 2 : BD - 2;
                            for (let ci = 0; ci < count; ci++) {
                                const col = new THREE.Mesh(colGeo, concMat);
                                const offset = -span / 2 + (ci + 0.5) * (span / count);
                                if (isLongFace) {
                                    const zSign = face === 4 ? 1 : -1;
                                    col.position.set(offset, 0.3 + wallH / 2, zSign * (BD / 2 - 0.4));
                                } else {
                                    const xSign = face === 0 ? 1 : -1;
                                    col.position.set(xSign * (BL / 2 - 0.4), 0.3 + wallH / 2, offset);
                                }
                                fGrp.add(col);
                            }
                        };
                        addColumns(INWARD[bi][0]);
                        addColumns(INWARD[bi][1]);

                        // Louvers on glass faces
                        const addLouvers = (face: number) => {
                            const isLong = (face === 4 || face === 5);
                            const cnt = isLong ? 14 : 4;
                            const span = isLong ? BL - 2 : BD - 2;
                            for (let li = 0; li < cnt; li++) {
                                const louver = new THREE.Mesh(louverGeo, louverMat);
                                const off = -span / 2 + (li + 0.5) * (span / cnt);
                                if (isLong) {
                                    const zs = face === 4 ? 1 : -1;
                                    louver.position.set(off, 0.3 + wallH / 2, zs * (BD / 2 - 0.15));
                                } else {
                                    const xs = face === 0 ? 1 : -1;
                                    louver.position.set(xs * (BL / 2 - 0.15), 0.3 + wallH / 2, off);
                                }
                                fGrp.add(louver);
                            }
                        };
                        addLouvers(INWARD[bi][0]);
                        addLouvers(INWARD[bi][1]);

                        // ── Room Nodes ──
                        const fz = FRONT_Z[bi];
                        if (lvl >= 3 && lvl <= 6) {
                            // 6 rooms per floor: front row 1-3, back row 4-6
                            const roomXs = [-16, 0, 16];
                            for (let ri = 0; ri < 3; ri++) {
                                // Front room
                                const fr = new THREE.Mesh(roomGeo, roomMat.clone());
                                fr.position.set(roomXs[ri], 0.3 + 0.8, fz * 3.5);
                                const frId = `${bId}${lvl}${ri + 1}`;
                                fr.userData = { isRoomNode: true, nodeId: frId, level: lvl, building: bId, side: 'front' };
                                fGrp.add(fr);
                                this.interactableRooms.push(fr);

                                // Back room
                                const br = new THREE.Mesh(roomGeo, roomMat.clone());
                                br.position.set(roomXs[ri], 0.3 + 0.8, -fz * 3.5);
                                const brId = `${bId}${lvl}${ri + 4}`;
                                br.userData = { isRoomNode: true, nodeId: brId, level: lvl, building: bId, side: 'behind' };
                                fGrp.add(br);
                                this.interactableRooms.push(br);
                            }
                        } else if (lvl === 1) {
                            // Level 1 landmarks
                            const lm = new THREE.Mesh(new THREE.BoxGeometry(20, 1.5, 8), landmarkMat);
                            lm.position.set(0, 0.3 + 1, 0);
                            const lmId = `${bId}10`;
                            lm.userData = { isRoomNode: true, nodeId: lmId, level: 1, building: bId };
                            fGrp.add(lm);
                            this.interactableRooms.push(lm);
                        } else if (lvl === 2) {
                            if (bId === 1 || bId === 2) {
                                // Theatre entry
                                const th = new THREE.Mesh(new THREE.BoxGeometry(18, 1.5, 6), landmarkMat);
                                th.position.set(0, 0.3 + 1, fz * 3);
                                th.userData = { isRoomNode: true, nodeId: `${bId}20`, level: 2, building: bId };
                                fGrp.add(th);
                                this.interactableRooms.push(th);
                            } else {
                                const rm = new THREE.Mesh(roomGeo, roomMat.clone());
                                rm.position.set(0, 0.3 + 0.8, 0);
                                rm.userData = { isRoomNode: true, nodeId: `${bId}22`, level: 2, building: bId };
                                fGrp.add(rm);
                                this.interactableRooms.push(rm);
                            }
                        }

                        // Roof slab on top floor
                        if (fi === NF - 1) {
                            const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(BL + 0.5, 0.3, BD + 0.5), concMat);
                            roofSlab.position.set(0, FH + 0.15, 0);
                            roofSlab.userData = { building: bId, level: lvl, type: 'roof' };
                            fGrp.add(roofSlab);
                        }

                        bGrp.add(fGrp);
                        const key = lvl.toString();
                        if (!this.floorGroups[key]) this.floorGroups[key] = [];
                        this.floorGroups[key].push(fGrp);
                    }
                    cg.add(bGrp);
                }

                // ── 3. SOLAR CANOPY ──
                const sg = new THREE.Group();
                const gridN = 14;
                const beamGeoX = new THREE.BoxGeometry(CANOPY_SPAN, 0.35, 0.35);
                const beamGeoZ = new THREE.BoxGeometry(0.35, 0.35, CANOPY_SPAN);
                for (let i = 0; i <= gridN; i++) {
                    const off = -CANOPY_SPAN / 2 + i * (CANOPY_SPAN / gridN);
                    const bx = new THREE.Mesh(beamGeoX, steelMat);
                    bx.position.set(0, CANOPY_ALT, off);
                    sg.add(bx);
                    const bz = new THREE.Mesh(beamGeoZ, steelMat);
                    bz.position.set(off, CANOPY_ALT, 0);
                    sg.add(bz);
                }
                // Diagonal truss cross-braces at edges
                const trussGeo = new THREE.BoxGeometry(0.2, 0.2, 15);
                for (const sign of [-1, 1]) {
                    for (const axis of ['x', 'z'] as const) {
                        const t = new THREE.Mesh(trussGeo, steelMat);
                        if (axis === 'x') {
                            t.position.set(sign * CANOPY_SPAN / 2, CANOPY_ALT - 1, 0);
                            t.rotation.y = Math.PI / 4;
                        } else {
                            t.position.set(0, CANOPY_ALT - 1, sign * CANOPY_SPAN / 2);
                            t.rotation.y = Math.PI / 4;
                        }
                        sg.add(t);
                    }
                }

                // Solar panel surface
                const panelGeo = new THREE.PlaneGeometry(CANOPY_SPAN - 2, CANOPY_SPAN - 2);
                const panel = new THREE.Mesh(panelGeo, solarMat);
                panel.rotation.x = -Math.PI / 2;
                panel.position.set(0, CANOPY_ALT + 0.2, 0);
                sg.add(panel);

                // Support columns (8 – two per building, rising from rooftop to canopy)
                const colH = CANOPY_ALT - BH;
                const supGeo = new THREE.BoxGeometry(0.6, colH, 0.6);
                for (const [px, pz] of BPOS) {
                    for (const dx of [-BL / 4, BL / 4]) {
                        const c = new THREE.Mesh(supGeo, steelMat);
                        c.position.set(px + dx, BH + colH / 2, pz);
                        sg.add(c);
                    }
                }

                this.solarGroup = sg;
                cg.add(sg);
            },

            // ────── Floor visibility toggle ──────
            toggleFloorVisibility(level: string) {
                if (!this.campusGroup) return;
                if (level === 'ALL') {
                    this.campusGroup.traverse((c: THREE.Object3D) => { c.visible = true; });
                    return;
                }
                if (level === 'basement') {
                    Object.values(this.floorGroups).forEach((gs: THREE.Group[]) => gs.forEach(g => { g.visible = false; }));
                    if (this.basementGroup) this.basementGroup.visible = true;
                    if (this.solarGroup) this.solarGroup.visible = false;
                    return;
                }
                const sel = parseInt(level);
                Object.entries(this.floorGroups).forEach(([k, gs]: [string, THREE.Group[]]) => {
                    const fl = parseInt(k);
                    gs.forEach(g => { g.visible = fl <= sel; });
                });
                if (this.basementGroup) this.basementGroup.visible = true;
                if (this.solarGroup) this.solarGroup.visible = sel >= NF;
            },

            // ────── Click interactivity ──────
            wireClicks(mapI: mapboxgl.Map) {
                mapI.getCanvas().addEventListener('click', (e) => {
                    const rect = mapI.getCanvas().getBoundingClientRect();
                    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                    this.raycaster.setFromCamera(this.mouse, this.camera);
                    const hits = this.raycaster.intersectObjects(this.interactableRooms, true);
                    if (hits.length > 0) {
                        const obj = hits[0].object as THREE.Mesh;
                        const nid = obj.userData.nodeId;
                        if (nid) {
                            const info = CampusLogicManager.getRoomInformation(nid);
                            setSelectedRoomText(info.text);
                            // Reset all glows
                            this.interactableRooms.forEach((rm: THREE.Mesh) => {
                                if (rm.material instanceof THREE.MeshStandardMaterial) {
                                    rm.material.emissive.setHex(0x004444);
                                    rm.material.emissiveIntensity = 0.4;
                                }
                            });
                            // Highlight selected
                            if (obj.material instanceof THREE.MeshStandardMaterial) {
                                obj.material.emissive.setHex(UIT_TEAL);
                                obj.material.emissiveIntensity = 1.0;
                            }
                        }
                    }
                });
            },

            // ────── Render loop ──────
            render(_gl: WebGLRenderingContext, matrix: number[]) {
                this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
                this.renderer?.resetState();
                // Pulse alert bins
                const t = Date.now() * 0.005;
                this.alertBins.forEach((b: THREE.Mesh) => {
                    if (b.material instanceof THREE.MeshStandardMaterial)
                        b.material.emissiveIntensity = 0.3 + (Math.sin(t) + 1) * 0.5;
                });
                if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
                map?.triggerRepaint();
            },
        };

        customLayerRef.current = layer;
        map.on('style.load', () => {
            if (map.getLayer('building')) map.removeLayer('building');
            map.addLayer(layer as any);
        });
        map.on('load', () => map.resize());
        setMapObj(map);

        return () => { map.remove(); mapInitialized.current = false; };
    }, [mapContainerRef]);

    // ── Derived bins ──
    const displayBins = bins.filter(b => {
        if (appliedFloor !== "ALL" && String(b.level) !== appliedFloor) return false;
        if (appliedBuilding !== "" && String(b.building_id) !== appliedBuilding) return false;
        return true;
    });

    const handleShowBins = () => {
        if (!mapObj || bins.length === 0) { alert("Map or bins not loaded yet."); return; }
        setAppliedFloor(activeFloor);
        setAppliedBuilding(activeBuilding);
        const valid = bins.filter(b => {
            if (activeFloor !== "ALL" && String(b.level) !== activeFloor) return false;
            if (activeBuilding !== "" && String(b.building_id) !== activeBuilding) return false;
            return true;
        });
        if (valid.length === 0) alert("No bins found for the selected criteria.");
    };

    const handleFloorSwitch = (level: string) => {
        setActiveFloor(level);
        if (customLayerRef.current?.toggleFloorVisibility) {
            customLayerRef.current.toggleFloorVisibility(level);
            mapObj?.triggerRepaint();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-headline font-bold flex items-center gap-2">
                        <MapPin className="w-8 h-8 text-primary" />
                        3D Campus Model
                    </h2>
                    <p className="text-muted-foreground">Live interactive Mapbox GL + Three.js digital twin.</p>
                </div>
                <Button onClick={handleShowBins} className="bg-primary hover:bg-primary/90 gap-2">
                    <Navigation className="w-4 h-4" />
                    Show Bins
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* ── Floor Switcher Panel ── */}
                <Card className="bg-card/50 border-primary/20 shadow-xl lg:col-span-1 shadow-primary/5">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-primary flex items-center gap-2">
                            <Layers className="w-5 h-5" />
                            Floor Switcher
                        </CardTitle>
                        <CardDescription>Select a level to reveal interior rooms.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={e => e.preventDefault()} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Current Level</label>
                                <select value={activeFloor} onChange={e => handleFloorSwitch(e.target.value)}
                                    className="w-full p-2 rounded-md bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option value="ALL">All Levels (Exterior)</option>
                                    <option value="6">Level 6</option>
                                    <option value="5">Level 5</option>
                                    <option value="4">Level 4</option>
                                    <option value="3">Level 3</option>
                                    <option value="2">Level 2</option>
                                    <option value="1">Level 1</option>
                                    <option value="basement">Basement</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Building (Optional)</label>
                                <select value={activeBuilding} onChange={e => setActiveBuilding(e.target.value)}
                                    className="w-full p-2 rounded-md bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option value="">All Buildings</option>
                                    <option value="1">Building 1 (NW)</option>
                                    <option value="2">Building 2 (NE)</option>
                                    <option value="3">Building 3 (SW)</option>
                                    <option value="4">Building 4 (SE)</option>
                                </select>
                            </div>
                        </form>

                        <div className="pt-4 border-t space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Room Selection</p>
                                <p className="text-sm font-medium text-primary">{selectedRoomText}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Bins ({displayBins.length})</p>
                                {displayBins.length > 0 ? (
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {displayBins.map((bin, i) => (
                                            <div key={i} className="flex justify-between items-center bg-background p-2 border rounded-md">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">Bin #{bin.id}</span>
                                                    <span className="text-xs text-muted-foreground">{(() => {
                                                        const b = String(bin.building_id), l = String(bin.level);
                                                        if (l === "basement") return "Shared Basement";
                                                        if (l === "1") {
                                                            if (b === "2") return "B2 – L1: Student Affairs";
                                                            if (b === "3") return "B3 – L1: Library";
                                                            return "B1/B4 – L1: Ground Floor Lobby";
                                                        }
                                                        if (l === "2" && (b === "1" || b === "2")) return `B${b} – L2: Theatres (Front Side Entry)`;
                                                        return `B${b} – L${l}: Near Room ${b}${l}2`;
                                                    })()}</span>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full ${bin.status === 'Full' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                    {bin.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No bins match criteria.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Mapbox Canvas ── */}
                <Card className="bg-card/50 border-border/50 overflow-hidden shadow-2xl lg:col-span-3 pb-0 mb-0 relative">
                    <CardContent className="p-0 m-0 w-full h-[600px] relative isolate">
                        <div id="map" ref={mapContainerRef}
                            className="absolute inset-0 bg-slate-900 z-10"
                            style={{ height: '100%', width: '100%', minHeight: '500px' }}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
