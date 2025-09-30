import React, { useState, useRef, useEffect } from 'react';
// import Login from "./Login";   // 🔹 Step 1: Import
import { toPng } from 'html-to-image';
import { db } from "./firebase";
//import { doc, getDoc, setDoc } from "firebase/firestore";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
//import { doc, setDoc, collection, onSnapshot } from "firebase/firestore";


const DOMAIN_COLORS = {
  'Home Buying': 'text-blue-600',
  'Everyday Banking': 'text-purple-700',
  'Customer Service Channels': 'text-pink-600',
  'Assisted Channels': 'text-yellow-600',
  'Consumer Finance': 'text-emerald-700',
  'Retail Tech Engg': 'text-fuchsia-700',
  'Run': 'text-cyan-700',        // Retail Run → cyan
  'Bankwest': 'text-orange-700', // Bankwest → orange
};

const ORDER = [
  "Home Buying",
  "Everyday Banking",
  "Customer Service Channels",
  "Assisted Channels",
  "Consumer Finance",
  "Retail Tech Engg",
  "Run",        // Retail Run
  "Bankwest"    // Bankwest
];

const RAG_COLORS = {
  Green: 'text-green-600',
  Amber: 'text-yellow-600',
  Red: 'text-red-600',
};

//Parseline 
const parseLine = (line, index) => {
  if (!line.trim()) return null;

  // Case: <header>content</header> - extra
  if (line.startsWith('<header>') && line.includes('</header>')) {
    const headerMatch = line.match(/<header>(.*?)<\/header>/);
    const headerText = headerMatch ? headerMatch[1] : '';
    const rest = line.replace(/<header>.*?<\/header>/, '').trim().replace(/^-/, '').trim();

    return (
      <div key={index} className="text-sm text-gray-900">
        <strong>{headerText}</strong> {rest}
      </div>
    );
  }

  // Case: <p>Paragraph</p>
  if (line.startsWith('<p>') && line.endsWith('</p>')) {
    const content = line.replace(/<p>|<\/p>/g, '');
    return (
      <div key={index} className="text-sm text-gray-700">
        {renderFormattedText(content)}
      </div>
    );
  }

  // Case: <sub>Sub Point</sub>
  if (line.startsWith('<sub>') && line.endsWith('</sub>')) {
    const content = line.replace(/<sub>|<\/sub>/g, '');
    return (
      <li key={index} className="ml-6 list-disc text-sm text-gray-700">
        {renderFormattedText(content)}
      </li>
    );
  }

  // Default bullet
  return (
    <li key={index} className="text-sm text-gray-700">
      {renderFormattedText(line)}
    </li>
  );
};


// renderformattedtext includes bold  now
const renderFormattedText = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    } else {
      return <span key={idx}>{part}</span>;
    }
  });
};





const DEFAULT_DOMAINS = [
  { domainName: 'Home Buying', lead: 'Praz Nadesan', teamSize: '115', status: 'Green', keyInitiatives: [], futureInitiatives: [], lowsrisks: [],  top3: [0, 1, 2], editing: false },
  { domainName: 'Everyday Banking', lead: 'Jade Sinclair', teamSize: '75', status: 'Green', keyInitiatives: [], futureInitiatives: [], lowsrisks: [],  top3: [0, 1, 2], editing: false },
  { domainName: 'Customer Service Channels', lead: 'Sarah Trask', teamSize: '24', status: 'Green', keyInitiatives: [], futureInitiatives: [], lowsrisks: [], top3: [0, 1, 2], editing: false },
  { domainName: 'Assisted Channels', lead: 'Jade Sinclair', teamSize: '7', status: 'Green', keyInitiatives: [], futureInitiatives: [], lowsrisks: [], top3: [0, 1, 2], editing: false },
  { domainName: 'Consumer Finance', lead: 'Dan Somerset', teamSize: '33', status: 'Green', keyInitiatives: [], futureInitiatives: [], lowsrisks: [], top3: [0, 1, 2], editing: false },
  { domainName: 'Retail Tech Engg', lead: 'Andy McQuarrie', teamSize: '49', status: 'Green', keyInitiatives: [], futureInitiatives: [], lowsrisks: [], top3: [0, 1, 2], editing: false },
   // ✅ New domains
   { domainName: 'Run', lead: 'Adam Sylvester', teamSize: '33', status: 'Green', keyInitiatives: [], futureInitiatives: [], lowsrisks: [], top3: [0,1,2], editing: false },
   { domainName: 'Bankwest', lead: 'Peter Harvey', teamSize: '11', status: 'Green', keyInitiatives: [], futureInitiatives: [], lowsrisks: [], top3: [0,1,2], editing: false }, 

];


// console.log("Current user:", user);

// const LOCAL_STORAGE_KEY = 'cio_dashboard_data_v7';


// 🔹 Simple inline login component
const USERS: Record<string, { password: string; role: string; domain?: string }> = {
  admin: { password: "admin123", role: "admin" },
  hbuser: { password: "hbuser123", role: "domainUser", domain: "Home Buying" },
  edbuser: { password: "edbuser123", role: "domainUser", domain: "Everyday Banking" },
  acuser: { password: "acuser123", role: "domainUser", domain: "Assisted Channels" },
  csuser: { password: "csuser123", role: "domainUser", domain: "Customer Service Channels" },
  cfuser: { password: "cfuser123", role: "domainUser", domain: "Consumer Finance" },
  rtenguser: { password: "rtenguser123", role: "domainUser", domain: "Retail Tech Engg" },
  viewer: { password: "viewer123", role: "viewer" },
};
//Added Login Component Below
const Login: React.FC<{ onLogin: (user: { username: string; role: string; domain?: string }) => void }> = ({ onLogin }) => {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = USERS[username];
    if (user && user.password === password) {
      onLogin({ username, role: user.role, domain: user.domain });
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-6 w-80">
        <h1 className="text-xl font-bold text-center mb-4">🔐 CIO Dashboard Login</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded w-full"
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

//Added Login Component Above


//New const App function below

//New const App Function above


const App = () => {
  const [user, setUser] = useState<{ username: string; role: string; domain?: string } | null>(null);

  const ref = useRef(null);
  const [downloadMode, setDownloadMode] = useState(false);

  const [title, setTitle] = useState('HCLTech – CBA Retail Tech Dashboard – JAS-25 | September');
  //const [executiveSummaryLeft, setExecutiveSummaryLeft] = useState('');
  //const [executiveSummaryRight, setExecutiveSummaryRight] = useState('');
  //const [notes, setNotes] = useState('');

  const [executiveSummaryLeft, setExecutiveSummaryLeft] = useState([]);
  const [executiveSummaryRight, setExecutiveSummaryRight] = useState([]);
  const [notes, setNotes] = useState([]);

  const [editSummary, setEditSummary] = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [editNotes, setEditNotes] = useState(false);

  const [submittedDomains, setSubmittedDomains] = useState(DEFAULT_DOMAINS);
  const [originalDomains, setOriginalDomains] = useState(DEFAULT_DOMAINS);

  const [loaded, setLoaded] = useState(false); //added to 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "meta", "dashboard");
        const snap = await getDoc(docRef);
  
        if (snap.exists()) {
          const data = snap.data();
          setTitle(data.title || "");
          setExecutiveSummaryLeft(data.executiveSummaryLeft || []);
          setExecutiveSummaryRight(data.executiveSummaryRight || []);
          setNotes(data.notes || []);
        }
  
        const domainsRef = collection(db, "domains");
        const domainSnap = await getDocs(domainsRef);
        const domains = domainSnap.docs.map((d) => d.data());
  
        // enforce custom order
        const sorted = ORDER.map((name) =>
          domains.find((d) => d.domainName === name) ||
          DEFAULT_DOMAINS.find((d) => d.domainName === name)
        );
  
        setSubmittedDomains(sorted);
        setLoaded(true);
      } catch (error) {
        console.error("Error fetching Firestore data:", error);
      }
    };
  
    fetchData();
  }, []);
  
  
  
  

  useEffect(() => {
    if (!loaded) return; // make sure Firestore is loaded first
    const saveMeta = async () => {
      try {
        await setDoc(doc(db, "meta", "dashboard"), {
          title,
          executiveSummaryLeft,
          executiveSummaryRight,
          notes,
        }, { merge: true });
      } catch (error) {
        console.error("Error saving Firestore meta:", error);
      }
    };
  
    saveMeta();
  }, [title, executiveSummaryLeft, executiveSummaryRight, notes]);
    
  useEffect(() => {
    if (!loaded) return;
    const saveDomains = async () => {
      try {
        for (const d of submittedDomains) {
          // use domainName directly as the document ID
          await setDoc(doc(db, "domains", d.domainName), d, { merge: true });
        }
      } catch (error) {
        console.error("Error saving Firestore domains:", error);
      }
    };
    saveDomains();
  }, [submittedDomains, loaded]);
  
  
  
  

  

  const handleDomainEditToggle = (index) => {
    const updated = [...submittedDomains];
    updated[index].editing = !updated[index].editing;
    setSubmittedDomains(updated);
  };

  const handleDomainChange = (index, field, value) => {
    const updated = [...submittedDomains];
    updated[index][field] = value;
    setSubmittedDomains(updated);
  };

  const handleDomainCancel = (index) => {
    const reverted = [...submittedDomains];
    reverted[index] = { ...originalDomains[index], editing: false };
    setSubmittedDomains(reverted);
  };

  const handleDownload = async () => {
    setDownloadMode(true);
    await new Promise((resolve) => setTimeout(resolve, 300)); // Give DOM time to update

    if (ref.current) {
      toPng(ref.current, { backgroundColor: 'transparent', pixelRatio: 2 })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'cio-dashboard.png';
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => console.error('Download failed', err))
        .finally(() => setDownloadMode(false));
    }
  };

  const MiniChart = ({ k = 0, f = 0, r = 0 }) => {
    const max = Math.max(k, f, r, 1);
    const w = (v) => Math.max(6, (v / max) * 100);
  
    return (
      <div className="mt-3 border border-gray-200 rounded-lg p-2 text-left">
        <div className="text-xs font-semibold mb-1 text-gray-700">Snapshot</div>
        <div className="space-y-1.5">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <span className="text-[10px] text-gray-600">Key Initiatives</span>
            <div className="h-2 rounded bg-blue-500" style={{ width: `${w(k)}%` }} />
            <span className="text-[10px] text-gray-600">{k}</span>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <span className="text-[10px] text-gray-600">Future Initiatives</span>
            <div className="h-2 rounded bg-indigo-500" style={{ width: `${w(f)}%` }} />
            <span className="text-[10px] text-gray-600">{f}</span>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <span className="text-[10px] text-gray-600">Lows / Risks</span>
            <div className="h-2 rounded bg-red-500" style={{ width: `${w(r)}%` }} />
            <span className="text-[10px] text-gray-600">{r}</span>
          </div>
        </div>
      </div>
    );
  };

  // 🔹 Guard: if no user, show login
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // 🔹 If logged in, show full dashboard
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 🔹 Add welcome banner */}
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Welcome, {user.username}!</h1>
        <button
          className="text-sm text-red-600 underline"
          onClick={() => setUser(null)}
        >
          Logout
        </button>
      </div>

      {/* ⬇️ Paste your ENTIRE dashboard JSX here (the long block you pasted) */}
      
      <div className="p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-6">
        {!downloadMode && (
          
          <button onClick={handleDownload} className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded hover:bg-green-700">
            📥 Download as Transparent PNG
          </button>

        )}
      </div>

      <div ref={ref}> 
      {/* Title */}
<div className={`${downloadMode ? 'mb-6 text-center' : 'text-center'}`}>
  {!editTitle ? (
    <>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      {!downloadMode && user?.role === "admin" && (
        <button onClick={() => setEditTitle(true)} className="text-blue-600 text-sm hover:underline">✏️ Edit Title</button>
      )}
    </>
  ) : (
    <div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="border p-2 rounded w-full mb-2" />
      <div className="flex gap-2 justify-end">
        <button onClick={() => setEditTitle(false)} className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
        <button onClick={() => setEditTitle(false)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancel</button>
      </div>
    </div>
  )}
</div>

 {/* Executive Summary */}
<div className="rounded-xl shadow p-6 mb-6 overflow-visible break-inside-avoid border border-gray-400" style={{ minHeight: '240px' }}>
  <h2 className="text-3xl font-bold mb-4 text-center text-yellow-700">Executive Summary</h2>
  {!editSummary ? (
    <>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2 space-y-2 text-sm text-gray-800 border-r border-gray-300 pr-4">
          <div className="pl-6 space-y-1">{executiveSummaryLeft.map((line, idx) => parseLine(line, idx))}</div>
        </div>
        <div className="w-full md:w-1/2 text-sm text-gray-800 pl-4">
          <div className="pl-6 space-y-1">{executiveSummaryRight.map((line, idx) => parseLine(line, idx))}</div>
        </div>
      </div>
      {!downloadMode && user?.role === "admin" && (
        <div className="text-right mt-2">
          <button onClick={() => setEditSummary(true)} className="text-blue-600 text-sm hover:underline">✏️ Edit Executive Summary</button>
        </div>
      )}
    </>
  ) : (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <textarea
      value={executiveSummaryLeft.join('\n')}
      onChange={(e) => setExecutiveSummaryLeft(e.target.value.split('\n'))}
      rows={4}
      className="border p-2 rounded col-span-1"
      />

      <textarea
      value={executiveSummaryRight.join('\n')}
      onChange={(e) => setExecutiveSummaryRight(e.target.value.split('\n'))}
      rows={4}
      className="border p-2 rounded col-span-1"
      />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={() => setEditSummary(false)} className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
        <button onClick={() => setEditSummary(false)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancel</button>
      </div>
    </div>
  )}
</div>


       {/* Domains */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  {submittedDomains.map((d, i) => (
    <div key={i} className="border border-gray-300 rounded-2xl p-4 shadow-sm bg-white">
      {!d.editing ? (
        <>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className={`text-lg font-bold ${DOMAIN_COLORS[d.domainName] || 'text-gray-800'}`}>{d.domainName}</span>
              <div className="text-sm text-gray-700 mt-1">
                RAG Status: <span className={`${RAG_COLORS[d.status]}`}> {d.status === 'Green' ? '🟢' : d.status === 'Amber' ? '🟡' : '🔴'} {d.status}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">{d.lead}</div>
              <div className="text-sm text-gray-600 mt-1">Team Size: {d.teamSize}</div>
            </div>
          </div>

          <MiniChart 
          k={d.keyInitiatives.filter(item => item.trim() !== "").length} 
          f={d.futureInitiatives.filter(item => item.trim() !== "").length} 
          r={d.lowsrisks.filter(item => item.trim() !== "").length} 
/>

          {/* Key Initiatives */}
          <div className="mt-3">
            <div className="font-semibold">
              Key Initiatives ({d.keyInitiatives.filter(item => item.trim() !== "").length})
            </div>

            {/* Only show helper line if > 3 */}
            {d.keyInitiatives.filter(item => item.trim() !== "").length > 3 && (
              <div className="text-xs text-gray-500 mb-1">Top 3 below:</div>
            )}

            <div className="pl-6 space-y-1 text-sm text-gray-700">
              {d.keyInitiatives
                .filter(item => item.trim() !== "")
                .slice(0, 3) // restrict to top 3
                .map((item, idx) => parseLine(item, idx))}
            </div>
          </div>


         
        {/* Future Initiatives */}
        <div className="mt-3">
          <div className="font-semibold">
            Future Initiatives ({d.futureInitiatives.filter(item => item.trim() !== "").length})
          </div>

          {/* Only show helper line if > 3 */}
          {d.futureInitiatives.filter(item => item.trim() !== "").length > 3 && (
            <div className="text-xs text-gray-500 mb-1">Top 3 below:</div>
          )}

          <div className="pl-6 space-y-1 text-sm text-gray-700">
            {d.futureInitiatives
              .filter(item => item.trim() !== "")
              .slice(0, 3)
              .map((item, idx) => parseLine(item, idx))}
          </div>
        </div>

           

          {/* Lows Risks */}
          <div className="mt-3">
            <div className="font-semibold">
              Lows / Risks ({d.lowsrisks.filter(item => item.trim() !== "").length})
            </div>

            {/* Only show helper line if > 3 */}
            {d.lowsrisks.filter(item => item.trim() !== "").length > 3 && (
              <div className="text-xs text-gray-500 mb-1">Top 3 below:</div>
            )}

            <div className="pl-6 space-y-1 text-sm text-gray-700">
              {d.lowsrisks
                .filter(item => item.trim() !== "")
                .slice(0, 3)
                .map((item, idx) => parseLine(item, idx))}
            </div>
          </div>
            

            {!downloadMode && 
            (user?.role === "admin" || user?.domain === d.domainName) && (
            <div className="text-right mt-2">
              <button onClick={() => {
                setOriginalDomains([...submittedDomains]);
                handleDomainEditToggle(i);
              }} className="text-blue-600 text-sm hover:underline">✏️ Edit Domain</button>
            </div>
          )}
        </>
      ) : (
        <div>
          <input value={d.domainName} onChange={(e) => handleDomainChange(i, 'domainName', e.target.value)} className="border p-2 rounded w-full mb-2" />
          <input value={d.lead} onChange={(e) => handleDomainChange(i, 'lead', e.target.value)} className="border p-2 rounded w-full mb-2" />
          <input value={d.teamSize} onChange={(e) => handleDomainChange(i, 'teamSize', e.target.value)} className="border p-2 rounded w-full mb-2" />
          <select value={d.status} onChange={(e) => handleDomainChange(i, 'status', e.target.value)} className="border p-2 rounded w-full mb-2">
            <option>Green</option>
            <option>Amber</option>
            <option>Red</option>
          </select>
          <textarea value={d.keyInitiatives.join('\n')} onChange={(e) => handleDomainChange(i, 'keyInitiatives', e.target.value.split('\n'))} rows={4} className="border p-2 rounded w-full mb-2" />
          <textarea value={d.futureInitiatives.join('\n')} onChange={(e) => handleDomainChange(i, 'futureInitiatives', e.target.value.split('\n'))} rows={4} className="border p-2 rounded w-full mb-2" />
          <textarea value={d.lowsrisks.join('\n')} onChange={(e) => handleDomainChange(i, 'lowsrisks', e.target.value.split('\n'))} rows={4} className="border p-2 rounded w-full mb-2" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => handleDomainEditToggle(i)} className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
            <button onClick={() => handleDomainCancel(i)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancel</button>
          </div>
        </div>
      )}
    </div>
  ))}
</div>


      {/* Notes Section */}
<div className="bg-white rounded-xl shadow p-4 mt-6">
  {!editNotes ? (
    <>
      <div className="flex justify-between items-center">
        <div className="font-bold text-gray-800">Note:</div>
        {!downloadMode && user?.role === "admin" && (
          <button onClick={() => setEditNotes(true)} className="text-blue-600 text-sm hover:underline">
            ✏️ Edit Note
          </button>
        )}
      </div>

      {/* Render notes with parseLine support */}
      <div className="mt-2 pl-6 space-y-1 text-sm text-gray-700">
        {notes.map((line, idx) => parseLine(line, idx))}
      </div>
    </>
  ) : (
    <div>
     <textarea
      value={notes.join('\n')}
      onChange={(e) => setNotes(e.target.value.split('\n'))}
      rows={3}
      className="border p-2 rounded w-full mt-2"
      />
      <div className="flex gap-2 justify-end mt-2">
        <button onClick={() => setEditNotes(false)} className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
        <button onClick={() => setEditNotes(false)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancel</button>
      </div>
    </div>
  )} 
</div>

      </div>
    </div>



    </div>
  );
};


export default App;
