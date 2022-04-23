import { useState, Fragment, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Dialog, Transition } from "@headlessui/react";
import { LogoutIcon, CogIcon, XIcon, MenuIcon } from "@heroicons/react/outline";
import { PlusSmIcon } from "@heroicons/react/solid";

import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { ref, onValue, set } from "firebase/database";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function guid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const Home = () => {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [openNewChatroom, setOpenNewChatroom] = useState(false);
  const [openChatroomSettings, setOpenChatroomSettings] = useState(false);

  const [privacy, setPrivacy] = useState("private");
  const [messages, setMessages] = useState(null);
  const [newMember, setNewMember] = useState("");
  const [currentChatroom, setCurrentChatroom] = useState("public");
  const [newChatroom, setNewChatroom] = useState("");
  const [chatroom, setChatroom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [newText, setNewText] = useState("");

  const navigate = useNavigate();

  onValue(
    ref(db, `rooms`),
    snapshot => {
      if (auth.currentUser) setCurrentUser(auth.currentUser);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const temp = [];
        for (let room in data) {
          if (!currentUser) continue;
          let canAccess = false;
          if (!data[room].private) canAccess = true;
          else if (data[room].private && data[room].users)
            for (let user in data[room].users) if (currentUser.email == data[room].users[user]) canAccess = true;

          if (canAccess) {
            temp.push({
              name: room,
              private: data[room].private,
              users: data[room].users,
            });
          }
          temp.sort(function (x, y) {
            return x.name == "public" ? -1 : y.name == "public" ? 1 : 0;
          });
          setChatroom(temp);
        }
      }
    },
    { onlyOnce: true }
  );

  onValue(
    ref(db, `rooms/${currentChatroom}/messages`),
    snapshot => {
      setMessages([]);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const temp = [];
        for (let message in data) {
          temp.push(data[message]);
        }
        temp.sort(function (a, b) {
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        setMessages(temp);
      }
    },
    { onlyOnce: true }
  );

  const handleLogout = e => {
    e.preventDefault();
    signOut(auth);
    navigate("/");
  };

  const handleNewText = async e => {
    e.preventDefault();
    const newId = guid();
    const data = {
      text: newText,
      createdAt: new Date().toLocaleString(),
      createdBy: currentUser.uid,
      name: currentUser.displayName,
      photo: currentUser.photoURL,
    };
    setNewText("");
    await set(ref(db, `rooms/${currentChatroom}/messages/${newId}`), data);
  };

  const handleCreateNewRoom = async e => {
    e.preventDefault();
    setOpenNewChatroom(false);
    const data = {
      private: privacy == "private",
    };
    await set(ref(db, `rooms/${newChatroom}`), data);
    await set(ref(db, `rooms/${newChatroom}/users/${currentUser.displayName}`), currentUser.email);
    setPrivacy("private");
    setNewChatroom("");
  };

  const handleAddNewMember = async e => {
    e.preventDefault();
    setOpenChatroomSettings(false);
    await set(ref(db, `rooms/${currentChatroom}/users/${newMember.split("@")[0]}`), newMember);
    setNewMember("");
  };

  return (
    <>
      <Transition.Root show={openChatroomSettings} as={Fragment}>
        <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={setOpenChatroomSettings}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0">
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="newMember" className="block text-sm font-medium ">
                        New member's email
                      </label>
                      <div className="mt-1">
                        <input
                          onChange={e => setNewMember(e.target.value)}
                          value={newMember}
                          id="newMember"
                          name="newMember"
                          type="email"
                          required
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                    onClick={handleAddNewMember}>
                    Add
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => setOpenChatroomSettings(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
      <Transition.Root show={openNewChatroom} as={Fragment}>
        <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={setOpenNewChatroom}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0">
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="newChatroom" className="block text-sm font-medium ">
                        New Chatroom Name
                      </label>
                      <div className="mt-1">
                        <input
                          onChange={e => setNewChatroom(e.target.value)}
                          value={newChatroom}
                          id="newChatroom"
                          name="newChatroom"
                          type="text"
                          required
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="privacy" className="block text-sm font-medium pt-2">
                          Privacy
                        </label>
                        <select
                          onChange={e => setPrivacy(e.target.value)}
                          id="privacy"
                          name="privacy"
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          defaultValue="private">
                          <option value="private">Private</option>
                          <option value="public">Public</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                    onClick={handleCreateNewRoom}>
                    Create
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => setOpenNewChatroom(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
      <Transition.Root show={openSidebar} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 flex z-40 md:hidden" onClose={setOpenSidebar}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0">
            <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full">
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setOpenSidebar(false)}>
                    <span className="sr-only">Close sidebar</span>
                    <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4">
                  <img
                    className="h-8 w-auto"
                    src="https://tailwindui.com/img/logos/workflow-logo-indigo-500-mark-white-text.svg"
                    alt="Workflow"
                  />
                </div>
                <nav className="mt-5 flex-1 px-2 space-y-1">
                  {chatroom && (
                    <div>
                      {chatroom.map(item => (
                        <a
                          onClick={e => setCurrentChatroom(e.target.id)}
                          id={item.name}
                          key={item.name}
                          className={classNames(
                            item.name == currentChatroom
                              ? "bg-gray-900 text-white"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white",
                            "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                          )}>
                          {item.name}
                        </a>
                      ))}
                    </div>
                  )}
                </nav>
                <div className="relative">
                  <div className="relative flex justify-center">
                    <button
                      onClick={() => {
                        setOpenNewChatroom(true);
                        setOpenSidebar(false);
                      }}
                      type="button"
                      className="inline-flex items-center shadow-sm px-4 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <PlusSmIcon className="-ml-1.5 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <span>New Chatroom</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex bg-gray-700 p-4">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    {currentUser && currentUser.photoURL !== null && (
                      <div>
                        <img
                          className="inline-block h-10 w-10 rounded-full"
                          src={currentUser ? currentUser.photoURL : ""}
                          alt=""
                        />
                      </div>
                    )}
                    {currentUser && currentUser.photoURL == null && (
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-500">
                        <span className="font-medium leading-none text-white">{currentUser.displayName}</span>
                      </span>
                    )}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">
                        {currentUser ? currentUser.displayName : ""}
                      </p>
                      <button className="text-xs font-medium text-gray-300 group-hover:text-gray-200">
                        View profile
                      </button>
                    </div>
                  </div>
                  <button onClick={handleLogout}>
                    <LogoutIcon className="text-gray-300 mr-3 flex-shrink-0 h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </Transition.Child>
          <div className="flex-shrink-0 w-14"></div>
        </Dialog>
      </Transition.Root>
      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <img
                className="h-8 w-auto"
                src="https://tailwindui.com/img/logos/workflow-logo-indigo-500-mark-white-text.svg"
                alt="Workflow"
              />
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {chatroom && (
                <div>
                  {chatroom.map(item => (
                    <a
                      onClick={e => setCurrentChatroom(e.target.id)}
                      id={item.name}
                      key={item.name}
                      className={classNames(
                        item.name == currentChatroom
                          ? "bg-gray-900 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white",
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                      )}>
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </nav>
            <div className="relative">
              <div className="relative flex justify-center">
                <button
                  onClick={() => {
                    setOpenNewChatroom(true);
                    setOpenSidebar(false);
                  }}
                  type="button"
                  className="inline-flex items-center shadow-sm px-4 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <PlusSmIcon className="-ml-1.5 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                  <span>New Chatroom</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex bg-gray-700 p-4">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center">
                {currentUser && currentUser.photoURL !== null && (
                  <div>
                    <img
                      className="inline-block h-10 w-10 rounded-full"
                      src={currentUser ? currentUser.photoURL : ""}
                      alt=""
                    />
                  </div>
                )}
                {currentUser && currentUser.photoURL == null && (
                  <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-500">
                    <span className="font-medium leading-none text-white">{currentUser.displayName}</span>
                  </span>
                )}
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{currentUser ? currentUser.displayName : ""}</p>
                  <button className="text-xs font-medium text-gray-300 group-hover:text-gray-200">
                    View profile
                  </button>
                </div>
              </div>
              <button onClick={handleLogout}>
                <LogoutIcon className="text-gray-300 mr-3 flex-shrink-0 h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setOpenSidebar(true)}>
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Replace with your content */}
              <div className="py-4">
                <section aria-labelledby="notes-title" className="h-full">
                  <div className=" bg-white shadow sm:rounded-lg sm:overflow-hidden">
                    <div className=" divide-y divide-gray-200">
                      <div className="flex items-center justify-between px-4 py-5 sm:px-6">
                        <h1 id="notes-title" className="text-lg font-medium text-gray-900">
                          {currentChatroom}
                        </h1>
                        <button onClick={() => setOpenChatroomSettings(true)}>
                          <CogIcon className=" mr-3 flex-shrink-0 h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="px-4 py-6 sm:px-6">
                        <ul role="list" className="space-y-8">
                          {currentUser && messages && (
                            <div>
                              {messages.map(message => (
                                <li key={message.createdAt}>
                                  {currentUser.uid !== message.createdBy && (
                                    <div className="flex pt-2 space-x-3">
                                      <div className="flex-shrink-0">
                                        {message.photo && (
                                          <div>
                                            <img className="h-10 w-10 rounded-full" src={message.photo} alt="" />
                                          </div>
                                        )}
                                        {!message.photo && (
                                          <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-500">
                                            <span className="font-medium leading-none text-white">
                                              {message.name}
                                            </span>
                                          </span>
                                        )}
                                      </div>
                                      <div>
                                        <div className="text-sm">
                                          <a href="#" className="font-medium text-gray-900">
                                            {message.name}{" "}
                                          </a>
                                        </div>
                                        <div className="mt-1 text-sm text-gray-700">
                                          <p>{message.text}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {currentUser.uid == message.createdBy && (
                                    <div className="flex pt-2 space-x-3 justify-end">
                                      <div className="flex flex-col items-end">
                                        <div className="text-sm ">
                                          <a href="#" className="font-medium text-gray-900">
                                            {message.name}{" "}
                                          </a>
                                        </div>
                                        <div className="mt-1 text-sm text-gray-700">
                                          <p>{message.text}</p>
                                        </div>
                                      </div>
                                      <div className="flex-shrink-0">
                                        {message.photo && (
                                          <div>
                                            <img className="h-10 w-10 rounded-full" src={message.photo} alt="" />
                                          </div>
                                        )}
                                        {!message.photo && (
                                          <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-500">
                                            <span className="font-medium leading-none text-white">
                                              {message.name}
                                            </span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </li>
                              ))}
                            </div>
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-6 sm:px-6">
                      <div className="flex space-x-3">
                        <div className="flex-shrink-0">
                          {/* <img className="h-10 w-10 rounded-full" src={user.imageUrl} alt="" /> */}
                        </div>
                        <div className="min-w-0 flex-1">
                          <form>
                            <div>
                              <textarea
                                onChange={e => setNewText(e.target.value)}
                                value={newText}
                                id="newText"
                                rows={3}
                                className="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md"
                              />
                            </div>
                            <div className="mt-3 flex items-center justify-end">
                              <button
                                onClick={handleNewText}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Send
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
              {/* /End replace */}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Home;
