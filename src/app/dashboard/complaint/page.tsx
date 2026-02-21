
// "use client";

// import { useState, useRef, useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Send, Image as ImageIcon, MapPin, Search } from 'lucide-react';
// import { cn } from '@/lib/utils';

// interface Message {
//   id: string;
//   sender: 'user' | 'collector';
//   text: string;
//   time: string;
//   photoUrl?: string;
// }

// interface Chat {
//   id: string;
//   location: string;
//   lastMessage: string;
//   time: string;
//   building: string;
//   level: string;
//   room: string;
//   unread?: boolean;
// }

// const chats: Chat[] = [
//   { id: '1', location: 'Bin 322', lastMessage: 'Cleaning in progress...', time: '10:45 AM', building: 'Building 3', level: 'Level 2', room: 'Room 322', unread: true },
//   { id: '2', location: 'Canteen Bins', lastMessage: 'Thank you for the report!', time: '9:30 AM', building: 'Basement', level: 'Basement', room: 'Canteen Area' },
//   { id: '3', location: 'Bin 222', lastMessage: 'Emptying now.', time: 'Yesterday', building: 'Building 2', level: 'Level 2', room: 'Room 222' },
// ];

// const mockMessages: Message[] = [
//   { id: '1', sender: 'user', text: 'The bin near Room 322 is overflowing.', time: '10:30 AM', photoUrl: 'https://picsum.photos/seed/waste/400/300' },
//   { id: '2', sender: 'collector', text: 'Received! I am heading there now.', time: '10:35 AM' },
//   { id: '3', sender: 'collector', text: 'Cleaning in progress...', time: '10:45 AM' },
// ];

// export default function ChatPage() {
//   const [selectedChat, setSelectedChat] = useState<Chat>(chats[0]);
//   const [messages, setMessages] = useState<Message[]>(mockMessages);
//   const [input, setInput] = useState('');
//   const scrollRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
//     }
//   }, [messages]);

//   const handleSend = () => {
//     if (!input.trim()) return;
//     const newMessage: Message = {
//       id: Date.now().toString(),
//       sender: 'user',
//       text: input,
//       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//     };
//     setMessages([...messages, newMessage]);
//     setInput('');
//   };

//   return (
//     <div className="flex h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">
//       {/* Sidebar */}
//       <Card className="hidden lg:flex flex-col w-80 bg-card/50 border-border/50">
//         <CardHeader className="p-4 border-b">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//             <Input className="pl-9 h-10 bg-background/50" placeholder="Search chats..." />
//           </div>
//         </CardHeader>
//         <ScrollArea className="flex-1">
//           {chats.map((chat) => (
//             <div
//               key={chat.id}
//               onClick={() => setSelectedChat(chat)}
//               className={cn(
//                 "p-4 cursor-pointer border-b transition-colors hover:bg-primary/5",
//                 selectedChat.id === chat.id ? "bg-primary/10 border-l-4 border-l-primary" : "bg-transparent"
//               )}
//             >
//               <div className="flex justify-between items-start mb-1">
//                 <span className="font-bold text-sm">Chat: {chat.location}</span>
//                 <span className="text-[10px] text-muted-foreground">{chat.time}</span>
//               </div>
//               <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
//               {chat.unread && (
//                 <div className="w-2 h-2 rounded-full bg-primary mt-2" />
//               )}
//             </div>
//           ))}
//         </ScrollArea>
//       </Card>

//       {/* Main Chat Area */}
//       <Card className="flex-1 flex flex-col bg-card/50 border-border/50 overflow-hidden relative">
//         {/* Chat Header / Context Bar */}
//         <div className="p-4 border-b bg-[#008080] text-white flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <Avatar className="w-10 h-10 border-2 border-white/20">
//               <AvatarFallback className="bg-white/20 text-white">CH</AvatarFallback>
//             </Avatar>
//             <div>
//               <h3 className="font-bold font-headline">{selectedChat.location}</h3>
//               <div className="flex items-center gap-2 text-[10px] opacity-80 uppercase tracking-widest font-bold">
//                 <MapPin className="w-3 h-3" />
//                 {selectedChat.building} • {selectedChat.level} • {selectedChat.room}
//               </div>
//             </div>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
//             <span className="text-xs font-medium">Collector Online</span>
//           </div>
//         </div>

//         {/* Messages */}
//         <ScrollArea className="flex-1 p-6" ref={scrollRef}>
//           <div className="space-y-6">
//             {messages.map((msg) => (
//               <div
//                 key={msg.id}
//                 className={cn(
//                   "flex flex-col max-w-[80%]",
//                   msg.sender === 'user' ? "ml-auto items-end" : "items-start"
//                 )}
//               >
//                 <div className={cn(
//                   "px-4 py-3 rounded-2xl shadow-sm",
//                   msg.sender === 'user' 
//                     ? "bg-primary text-primary-foreground rounded-tr-none" 
//                     : "bg-muted text-foreground rounded-tl-none"
//                 )}>
//                   {msg.photoUrl && (
//                     <img 
//                       src={msg.photoUrl} 
//                       alt="Proof" 
//                       className="rounded-lg mb-2 max-w-full h-auto cursor-zoom-in hover:opacity-90 transition-opacity" 
//                     />
//                   )}
//                   <p className="text-sm leading-relaxed">{msg.text}</p>
//                 </div>
//                 <span className="text-[10px] text-muted-foreground mt-1 px-1">{msg.time}</span>
//               </div>
//             ))}
//           </div>
//         </ScrollArea>

//         {/* Input Bar */}
//         <div className="p-4 border-t bg-card/80 backdrop-blur-sm">
//           <div className="flex gap-2">
//             <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-primary">
//               <ImageIcon className="w-5 h-5" />
//             </Button>
//             <Input 
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
//               placeholder="Type your message..." 
//               className="flex-1 bg-background/50 h-11"
//             />
//             <Button onClick={handleSend} className="bg-primary hover:bg-primary/90 h-11 px-6 shadow-lg shadow-primary/20">
//               <Send className="w-4 h-4" />
//             </Button>
//           </div>
//         </div>
//       </Card>
//     </div>
//   );
// }







// "use client";

// import { useState, useRef, useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Send, Image as ImageIcon, MapPin, MessageSquareWarning } from 'lucide-react';
// import { cn } from '@/lib/utils';

// interface Message {
//   id: string;
//   sender: 'user' | 'collector';
//   text: string;
//   time: string;
//   photoUrl?: string;
// }

// const initialMessages: Message[] = [
//   { id: '1', sender: 'collector', text: 'Hello! Please describe your complaint or issue here. You can attach photos for proof.', time: 'System' },
// ];

// export default function LodgeComplaintPage() {
//   const [messages, setMessages] = useState<Message[]>(initialMessages);
//   const [input, setInput] = useState('');
//   const scrollRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
//     }
//   }, [messages]);

//   const handleSend = () => {
//     if (!input.trim()) return;
//     const newMessage: Message = {
//       id: Date.now().toString(),
//       sender: 'user',
//       text: input,
//       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//     };
//     setMessages([...messages, newMessage]);
//     setInput('');
//   };

//   return (
//     <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] animate-in fade-in duration-500">
//       <Card className="flex-1 h-full flex flex-col bg-card/50 border-border/50 overflow-hidden relative shadow-2xl">

//         {/* Chat Header / Context Bar - 'Close' Button Removed */}
//         <div className="p-4 border-b bg-[#008080] text-white flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <Avatar className="w-10 h-10 border-2 border-white/20">
//               <AvatarFallback className="bg-white/20 text-white">
//                 <MessageSquareWarning className="w-5 h-5" />
//               </AvatarFallback>
//             </Avatar>
//             <div>
//               <h3 className="font-bold font-headline text-lg">Lodge a Complaint</h3>
//               <div className="flex items-center gap-2 text-[10px] opacity-80 uppercase tracking-widest font-bold">
//                 <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
//                 Direct support channel
//               </div>
//             </div>
//           </div>
//           {/* Close button has been removed from here */}
//         </div>

//         {/* Messages Area */}
//         <ScrollArea className="flex-1 p-6 bg-background/20" ref={scrollRef}>
//           <div className="max-w-3xl mx-auto space-y-6">
//             {messages.map((msg) => (
//               <div
//                 key={msg.id}
//                 className={cn(
//                   "flex flex-col max-w-[80%]",
//                   msg.sender === 'user' ? "ml-auto items-end" : "items-start"
//                 )}
//               >
//                 <div className={cn(
//                   "px-4 py-3 rounded-2xl shadow-sm border",
//                   msg.sender === 'user' 
//                     ? "bg-primary text-primary-foreground rounded-tr-none border-primary" 
//                     : "bg-muted text-foreground rounded-tl-none border-border"
//                 )}>
//                   {msg.photoUrl && (
//                     <img 
//                       src={msg.photoUrl} 
//                       alt="Proof" 
//                       className="rounded-lg mb-2 max-w-full h-auto" 
//                     />
//                   )}
//                   <p className="text-sm leading-relaxed">{msg.text}</p>
//                 </div>
//                 <span className="text-[10px] text-muted-foreground mt-1 px-1 font-semibold uppercase tracking-tighter">
//                   {msg.sender === 'user' ? 'You' : 'Staff'} • {msg.time}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </ScrollArea>

//         {/* Input Bar */}
//         <div className="p-4 border-t bg-card/80 backdrop-blur-sm">
//           <div className="max-w-3xl mx-auto flex gap-2">
//             <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-primary">
//               <ImageIcon className="w-5 h-5" />
//             </Button>
//             <Input 
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
//               placeholder="Type your complaint details here..." 
//               className="flex-1 bg-background/50 h-11 border-border/50 focus-visible:ring-primary"
//             />
//             <Button onClick={handleSend} className="bg-primary hover:bg-primary/90 h-11 px-6 shadow-lg shadow-primary/20 transition-all active:scale-95">
//               <Send className="w-4 h-4 mr-2" />
//               Submit
//             </Button>
//           </div>
//         </div>
//       </Card>
//     </div>
//   );
// }




// "use client";

// import { useState, useRef, useEffect } from 'react';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Send, Image as ImageIcon, MessageSquareWarning, Loader2, X } from 'lucide-react';
// import { cn } from '@/lib/utils';
// import { submitComplaintMessage } from '@/app/actions/complaint';

// export default function LodgeComplaintPage() {
//   const userEmail = "student@gmail.com"; 

//   const [messages, setMessages] = useState<{text: string, photo?: string}[]>([]);
//   const [input, setInput] = useState('');
//   const [isSending, setIsSending] = useState(false);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);

//   const scrollRef = useRef<HTMLDivElement>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
//   }, [messages]);

//   const handleSend = async () => {
//     if (!input.trim() && !selectedFile) return;
//     setIsSending(true);

//     const formData = new FormData();
//     formData.append("message", input);
//     formData.append("email", userEmail);
//     if (selectedFile) formData.append("image", selectedFile);

//     try {
//       const response = await submitComplaintMessage(formData);
//       if (response.success) {
//         // Update local UI state
//         setMessages(prev => [...prev, { text: input, photo: response.imageUrl }]);
//         setInput('');
//         setSelectedFile(null);
//       }
//     } finally {
//       setIsSending(false);
//     }
//   };

//   return (
//     <div className="max-w-5xl mx-auto h-[calc(100vh-140px)]">
//       <Card className="h-full flex flex-col bg-card/50 border-border/50 overflow-hidden shadow-2xl">
//         <div className="p-4 border-b bg-[#008080] text-white flex items-center gap-3">
//           <Avatar className="w-10 h-10 border-2 border-white/20">
//             <AvatarFallback className="bg-white/20 text-white"><MessageSquareWarning /></AvatarFallback>
//           </Avatar>
//           <div>
//             <h3 className="font-bold text-lg">Unified Complaint Log</h3>
//             <p className="text-[10px] opacity-80 font-bold italic">{userEmail}</p>
//           </div>
//         </div>

//         <ScrollArea className="flex-1 p-6" ref={scrollRef}>
//           <div className="max-w-3xl mx-auto space-y-4">
//             {messages.map((msg, i) => (
//               <div key={i} className="flex flex-col items-end ml-auto max-w-[80%]">
//                 <div className="px-4 py-3 rounded-2xl bg-primary text-primary-foreground rounded-tr-none">
//                   {msg.photo && <img src={msg.photo} className="rounded mb-2 max-h-40" alt="attachment" />}
//                   <p className="text-sm">{msg.text}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </ScrollArea>

//         <div className="p-4 border-t bg-card/80">
//           <div className="max-w-3xl mx-auto flex flex-col gap-2">
//             {selectedFile && (
//               <div className="flex items-center gap-2 bg-primary/10 p-2 rounded text-[10px] font-bold text-primary w-fit">
//                 <ImageIcon className="w-3 h-3" /> {selectedFile.name}
//                 <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedFile(null)} />
//               </div>
//             )}
//             <div className="flex gap-2">
//               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
//               <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
//                 <ImageIcon className="w-5 h-5" />
//               </Button>
//               <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add to your complaint log..." className="bg-background/50" disabled={isSending} />
//               <Button onClick={handleSend} disabled={isSending} className="bg-primary px-6">
//                 {isSending ? <Loader2 className="w-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
//                 Submit
//               </Button>
//             </div>
//           </div>
//         </div>
//       </Card>
//     </div>
//   );
// }






"use client";

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Image as ImageIcon, MessageSquareWarning, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitComplaintMessage } from '@/app/actions/complaint';
import { getUserComplaints } from '@/app/actions/userActivities';

interface Message {
  text: string;
  sender: 'user' | 'collector';
  photo?: string;
  time?: string;
}

export default function LodgeComplaintPage() {
  // --- 1. MAKE THE EMAIL ALIVE ---
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    // Get the real email you saved during login
    const savedEmail = localStorage.getItem('user_email');
    if (savedEmail) {
      setUserEmail(savedEmail);
    }
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // --- GET COMPLAINTS HISTORY ON LOAD ---
  useEffect(() => {
    if (!userEmail) return;

    const fetchHistory = async () => {
      const res: any = await getUserComplaints(userEmail);
      if (res.success && res.complaints) {
        const history: Message[] = [];
        // Sort earliest first, although DB might return based on report_date sorting
        // the Next.js DB call doesn't order. Let's assume order is fine.
        res.complaints.forEach((c: any) => {
          const photos = c.image_url ? c.image_url.split(',') : [];
          history.push({
            text: c.message,
            sender: 'user',
            photo: photos[0],
            time: new Date(c.report_date).toLocaleDateString()
          });

          if (c.admin_response) {
            history.push({
              text: c.admin_response,
              sender: 'collector',
              time: 'Reply'
            });
          }
        });
        setMessages(history);
      }
    };

    // Fetch immediately and poll every 10 seconds to auto-receive replies
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const handleSend = async () => {
    // Prevent sending if email isn't loaded yet
    if (!userEmail) {
      alert("User email not found. Please log in again.");
      return;
    }

    if (!input.trim() && !selectedFile) return;
    setIsSending(true);

    const formData = new FormData();
    formData.append("message", input);
    formData.append("email", userEmail); // Sends the ALIVE email
    if (selectedFile) formData.append("image", selectedFile);

    try {
      const response = await submitComplaintMessage(formData);
      if (response.success) {
        setMessages(prev => [...prev, { text: input, photo: response.imageUrl, sender: 'user', time: 'Just now' }]);
        setInput('');
        setSelectedFile(null);
      }
    } finally {
      setIsSending(false);
    }
  };

  // If email is still loading, show a small loader
  if (!userEmail) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)]">
      <Card className="h-full flex flex-col bg-card/50 border-border/50 overflow-hidden shadow-2xl">
        <div className="p-4 border-b bg-[#008080] text-white flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white/20">
            <AvatarFallback className="bg-white/20 text-white"><MessageSquareWarning /></AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-lg">Unified Complaint Log</h3>
            {/* Shows the actual logged-in Gmail */}
            <p className="text-[10px] opacity-80 font-bold italic">{userEmail}</p>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground text-sm italic">No messages sent today yet.</p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col max-w-[80%]",
                  msg.sender === 'user' ? "items-end ml-auto" : "items-start"
                )}
              >
                <div className={cn(
                  "px-4 py-3 rounded-2xl shadow-sm border",
                  msg.sender === 'user'
                    ? "bg-primary text-primary-foreground rounded-tr-none border-primary"
                    : "bg-muted text-foreground rounded-tl-none border-border"
                )}>
                  {msg.photo && <img src={msg.photo} className="rounded mb-2 max-h-40" alt="attachment" />}
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1 font-semibold uppercase tracking-tighter">
                  {msg.sender === 'user' ? 'You' : 'Staff'} • {msg.time}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Bar Section */}
        <div className="p-4 border-t bg-card/80">
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            {selectedFile && (
              <div className="flex items-center gap-2 bg-primary/10 p-2 rounded text-[10px] font-bold text-primary w-fit">
                <ImageIcon className="w-3 h-3" /> {selectedFile.name}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedFile(null)} />
              </div>
            )}
            <div className="flex gap-2">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
                <ImageIcon className="w-5 h-5" />
              </Button>
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add to your complaint log..." className="bg-background/50" disabled={isSending} />
              <Button onClick={handleSend} disabled={isSending} className="bg-primary px-6">
                {isSending ? <Loader2 className="w-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Submit
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}