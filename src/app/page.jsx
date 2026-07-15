// @ts-nocheck
"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); 
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [profilePicInput, setProfilePicInput] = useState(""); 
  const [authMessage, setAuthMessage] = useState({ text: "", type: "" });
  const [currentUser, setCurrentUser] = useState(null); 

  const [profiles, setProfiles] = useState([]);
  const [usersList, setUsersList] = useState([]); 
  const [newHandle, setNewHandle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = async () => {
    const profRes = await fetch("/api/profiles");
    setProfiles(await profRes.json());
    
    const userRes = await fetch("/api/users");
    setUsersList(await userRes.json());
  };

  // [NEW] The Share Interceptor
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url') || params.get('text');

    if (sharedUrl && sharedUrl.includes('instagram.com/')) {
      try {
        // IG URLs look like: https://www.instagram.com/username/?igshid=xyz
        const urlObj = new URL(sharedUrl);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        
        if (pathParts.length > 0) {
          setNewHandle(pathParts[0]); // Auto-fills the username!
          window.history.replaceState(null, '', '/'); // Cleans up the URL bar
        }
      } catch (e) {
        console.error("Could not parse shared URL");
      }
    }
  }, []);

  // Your existing data fetcher
  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicInput(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthMessage({ text: "", type: "" });

    const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
    const payload = isSignUp 
      ? { username: usernameInput, password: passwordInput, profilePic: profilePicInput }
      : { username: usernameInput, password: passwordInput };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (isSignUp) {
          if (usernameInput.toLowerCase() === 'yehia') {
             setAuthMessage({ text: "Account created with admin privileges! You can now log in.", type: "success" });
          } else {
             setAuthMessage({ text: "Account created! Waiting for approval.", type: "success" });
          }
          setIsSignUp(false); 
          setPasswordInput("");
          setProfilePicInput("");
        } else {
          setIsAuthenticated(true);
          setCurrentUser(data.username);
        }
      } else {
        setAuthMessage({ text: data.error, type: "error" });
      }
    } catch (error) {
      setAuthMessage({ text: "Server offline.", type: "error" });
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsernameInput("");
    setPasswordInput("");
    setProfilePicInput("");
    setAuthMessage({ text: "", type: "" });
  };

  const handleAdminAction = async (userId, action) => {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, action }),
    });
    fetchData(); 
  };

  const addProfile = async (e) => {
    e.preventDefault(); 
    setErrorMessage(""); 
    const cleanedHandle = newHandle.trim(); 
    if (!cleanedHandle) return setErrorMessage("You can't add an empty handle!");
    if (cleanedHandle.includes(" ")) return setErrorMessage("Instagram handles cannot contain spaces.");

    const response = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // [NEW] Sending the currentUser to the backend
      body: JSON.stringify({ instagram_handle: cleanedHandle, username: currentUser }), 
    });

    if (!response.ok) return setErrorMessage("Already in the market!");
    setNewHandle(""); 
    fetchData(); 
  };

  const changeStatus = async (id, newStatus) => {
    await fetch("/api/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // [NEW] Sending the currentUser to the backend
      body: JSON.stringify({ id, status: newStatus, username: currentUser }),
    });
    fetchData(); 
  };

  const deleteProfile = async (id) => {
    await fetch("/api/profiles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchData(); 
  };

  const handleDragStart = (e, id) => e.dataTransfer.setData("card_id", id.toString());
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("card_id");
    if (draggedId) await changeStatus(parseInt(draggedId), newStatus);
  };

  const renderColumn = (title, statusName) => {
    const columnProfiles = profiles.filter((p) => p.status === statusName);
    return (
      <div 
        className="bg-zinc-900 p-4 rounded-xl w-full min-h-[500px] border-2 border-zinc-800 hover:border-pink-900/50 transition-all shadow-inner"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, statusName)}
      >
        <h2 className="text-xl font-bold mb-4 text-rose-200 text-center tracking-wide">{title}</h2>
        <div className="flex flex-col gap-3">
          {columnProfiles.map((profile) => (
            <div 
              key={profile.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, profile.id)}
              className="relative bg-zinc-950 p-4 rounded-lg shadow-md flex flex-col gap-2 cursor-grab active:cursor-grabbing hover:shadow-pink-500/20 border border-zinc-800 hover:border-pink-500 transition-all group"
            >
              {currentUser?.toLowerCase() === "yehia" && (
                <button 
                  onClick={() => deleteProfile(profile.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                  title="Delete Target"
                >
                  🗑️
                </button>
              )}
              
              <a 
              href={`https://instagram.com/${profile.instagram_handle}`} 
               target="_blank" 
               rel="noopener noreferrer"
               className="font-bold text-zinc-100 hover:text-pink-400 transition-colors pr-6 underline decoration-pink-500/30 underline-offset-4"
                >
                @{profile.instagram_handle}
                </a>  

              <select
                className="border border-zinc-700 p-2 rounded text-zinc-300 text-sm bg-zinc-800 cursor-pointer focus:outline-none focus:border-pink-500"
                value={profile.status}
                onChange={(e) => changeStatus(profile.id, e.target.value)}
              >
                <option value="Free Game">Free Game</option>
                <option value="Request Sent">Request Sent</option>
                <option value="Bagged">Bagged</option>
              </select>

              {/* [NEW] The Tracking Display */}
              <div className="text-xs mt-1 pt-2 border-t border-zinc-800/50 flex flex-col gap-1">
                {profile.status === "Free Game" && profile.uploader_name && (
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    Added by: <span className="text-zinc-300 font-bold capitalize">{profile.uploader_name}</span>
                  </p>
                )}
                {profile.status === "Request Sent" && profile.requester_name && (
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    Sent by: <span className="text-rose-400 font-bold capitalize">{profile.requester_name}</span>
                  </p>
                )}
                {profile.status === "Bagged" && profile.bagger_name && (
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    Bagged by: <span className="text-pink-400 font-bold capitalize">{profile.bagger_name}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans">
        <div className="bg-zinc-900 p-8 rounded-2xl shadow-2xl shadow-pink-900/20 max-w-sm w-full border border-zinc-800 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-600/20 rounded-full blur-3xl"></div>
          
          <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-600 mb-6 relative z-10">
            {isSignUp ? "Join The Hunt" : "Locked Heart"}
          </h1>
          
          <form onSubmit={handleAuth} className="flex flex-col gap-4 relative z-10">
            <input
              type="text"
              placeholder="Username"
              className="border border-zinc-700 p-3 rounded-lg text-zinc-100 bg-zinc-950 focus:outline-none focus:border-pink-500"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="border border-zinc-700 p-3 rounded-lg text-zinc-100 bg-zinc-950 focus:outline-none focus:border-pink-500"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            
            {isSignUp && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-400 font-bold ml-1">Upload Profile Picture (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="border border-zinc-700 p-2 rounded-lg text-zinc-400 bg-zinc-950 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-pink-400 hover:file:bg-zinc-700 transition-all cursor-pointer"
                />
              </div>
            )}

            <button type="submit" className="bg-gradient-to-r from-rose-600 to-pink-600 text-white p-3 rounded-lg font-bold shadow-lg shadow-pink-900/30 mt-2">
              {isSignUp ? "Request Access" : "Unlock"}
            </button>
            
            {authMessage.text && (
              <p className={`text-sm text-center font-semibold ${authMessage.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {authMessage.text}
              </p>
            )}

            <p className="text-center text-zinc-400 text-sm mt-2">
              {isSignUp ? "Already a hunter?" : "Not on the roster?"}{" "}
              <button 
                type="button" 
                onClick={() => { setIsSignUp(!isSignUp); setAuthMessage({text: "", type: ""}); setProfilePicInput(""); }} 
                className="text-pink-400 font-bold hover:underline"
              >
                {isSignUp ? "Log In" : "Sign Up"}
              </button>
            </p>
          </form>
        </div>
      </main>
    );
  }

  const activeUsers = usersList.filter(u => u.status === 'active');
  const pendingUsers = usersList.filter(u => u.status === 'pending');
  const bannedUsers = usersList.filter(u => u.status === 'banned');

  return (
    <main className="min-h-screen p-8 bg-zinc-950 font-sans text-zinc-100">
      <h1 className="text-5xl font-extrabold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-500 to-purple-500 drop-shadow-sm">
        The Hunt Is On
      </h1>
      <div className="flex flex-col items-center justify-center mb-10 gap-2">
        <p className="text-center text-zinc-400 font-medium tracking-widest uppercase text-sm">
          Target Locked | Hunter: <span className="text-pink-400 font-bold capitalize">{currentUser}</span>
        </p>
        <button onClick={handleLogout} className="text-xs text-zinc-500 border border-zinc-800 px-4 py-1.5 rounded-full hover:border-rose-900/50 bg-zinc-900/50">
          Disconnect
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto">
        
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-8">
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-fit shadow-lg">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 pb-2 border-b border-zinc-800">
              Active Hunters
            </h3>
            <div className="flex flex-col gap-4">
              {activeUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    
                    {currentUser === user.username ? (
                      <label className="cursor-pointer relative group/avatar">
                        <img src={user.profile_pic_url} alt={user.username} className="w-10 h-10 rounded-full border-2 border-pink-500/50 bg-zinc-800 object-cover group-hover/avatar:opacity-50 transition-opacity"/>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity text-[10px] font-bold text-white text-center leading-tight drop-shadow-md">
                          Edit
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                await fetch("/api/users", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ action: 'change_pic', username: currentUser, profilePic: reader.result })
                                });
                                fetchData(); 
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    ) : (
                      <img src={user.profile_pic_url} alt={user.username} className="w-10 h-10 rounded-full border-2 border-zinc-700 bg-zinc-800 object-cover"/>
                    )}

                    <span className="font-semibold text-zinc-200 capitalize text-sm">{user.username}</span>
                    {user.username.toLowerCase() === 'yehia' && <span title="Admin" className="text-xs">👑</span>}
                  </div>
                  
                  {currentUser?.toLowerCase() === "yehia" && user.username.toLowerCase() !== 'yehia' && (
                    <button 
                      onClick={() => handleAdminAction(user.id, 'ban')}
                      className="text-xs bg-rose-950 text-rose-400 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold border border-rose-900/50"
                    >
                      Ban
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {currentUser?.toLowerCase() === "yehia" && pendingUsers.length > 0 && (
            <div className="bg-rose-950/20 border border-rose-900/50 rounded-2xl p-6 h-fit shadow-lg">
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-6 pb-2 border-b border-rose-900/50">
                Pending Approval
              </h3>
              <div className="flex flex-col gap-4">
                {pendingUsers.map(user => (
                  <div key={user.id} className="flex flex-col gap-2 p-2 bg-zinc-900/80 rounded-lg border border-zinc-800">
                    <div className="flex items-center gap-2">
                      <img src={user.profile_pic_url} alt={user.username} className="w-8 h-8 rounded-full bg-zinc-800 object-cover"/>
                      <span className="font-semibold text-zinc-200 capitalize text-sm">{user.username}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAdminAction(user.id, 'approve')} className="flex-1 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-400 text-xs font-bold py-1 rounded transition-colors">Accept</button>
                      <button onClick={() => handleAdminAction(user.id, 'kick')} className="flex-1 bg-rose-900/50 hover:bg-rose-800 text-rose-400 text-xs font-bold py-1 rounded transition-colors">Kick</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentUser?.toLowerCase() === "yehia" && bannedUsers.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 h-fit shadow-lg">
              <h3 className="text-sm font-bold text-zinc-600 uppercase tracking-widest mb-6 pb-2 border-b border-zinc-800">
                Banished
              </h3>
              <div className="flex flex-col gap-4">
                {bannedUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 opacity-50">
                      <img src={user.profile_pic_url} alt={user.username} className="w-8 h-8 rounded-full bg-zinc-800 grayscale object-cover"/>
                      <span className="font-semibold text-zinc-400 capitalize text-sm line-through">{user.username}</span>
                    </div>
                    <button 
                      onClick={() => handleAdminAction(user.id, 'unban')}
                      className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded hover:bg-zinc-700 hover:text-white transition-colors font-bold"
                    >
                      Pardon
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        <div className="flex-1">
          <div className="max-w-md mx-auto mb-12">
            <form onSubmit={addProfile} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Enter IG handle..."
                className="border border-zinc-700 p-3 rounded-lg flex-1 text-zinc-100 bg-zinc-900 focus:outline-none focus:border-pink-500"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
              />
              <button type="submit" className="bg-gradient-to-r from-rose-600 to-pink-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg">
                Add
              </button>
            </form>
            {errorMessage && <div className="bg-rose-950/50 border border-rose-500/50 text-rose-300 p-3 rounded-lg text-sm font-semibold text-center mt-2">{errorMessage}</div>}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {renderColumn("🏹 Free Game", "Free Game")}
            {renderColumn("💌 Request Sent", "Request Sent")}
            {renderColumn("💝 Bagged", "Bagged")}
          </div>
        </div>
      </div>
    </main>
  );
}