import { useState, Fragment, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Dialog, Transition } from "@headlessui/react";
import { LogoutIcon, CogIcon, XIcon, MenuIcon } from "@heroicons/react/outline";
import { PlusSmIcon } from "@heroicons/react/solid";

import { auth, db, messaging, token } from "../firebase";
import { updateProfile, signOut } from "firebase/auth";
import { ref, onValue, set } from "firebase/database";
import { onMessage } from "firebase/messaging";

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
  const [openProfile, setOpenProfile] = useState(false);
  const [openNewChatroom, setOpenNewChatroom] = useState(false);
  const [openChatroomSettings, setOpenChatroomSettings] = useState(false);

  const [privacy, setPrivacy] = useState("private");
  const [messages, setMessages] = useState(null);
  const [newMember, setNewMember] = useState("");
  const [currentChatroom, setCurrentChatroom] = useState("public");
  const [newChatroom, setNewChatroom] = useState("");
  const [chatroom, setChatroom] = useState(null);

  const [newDisplayName, setNewDisplayName] = useState("");
  const [newAbout, setNewAbout] = useState("");
  const [newPhotoURL, setNewPhotoURL] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newURL, setNewURL] = useState("");
  const [newCompany, setNewCompany] = useState("");

  const [newText, setNewText] = useState("");
  const [load, setLoad] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();

  // onMessage(messaging, payload => {
  //   console.log("Message received. ", payload);
  //   // ...
  // });

  useEffect(() => {
    if (!auth.currentUser) navigate("/");
  }, []);

  if (auth.currentUser && !load)
    onValue(
      ref(db, `users/${auth.currentUser.uid}`),
      snapshot => {
        if (snapshot.exists()) {
          const user = snapshot.val();
          setCurrentUser({
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: user.displayName,
            about: user.about,
            photoURL: user.photoURL,
            firstName: user.firstName,
            lastName: user.lastName,
            url: user.url,
            company: user.company,
          });
        } else {
          setCurrentUser({
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName,
            photoURL: auth.currentUser.photoURL,
          });
        }
        setLoad(true);
      },
      { onlyOnce: true }
    );

  onValue(
    ref(db, `rooms`),
    snapshot => {
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

  const handleViewProfile = () => {
    setOpenProfile(true);
    setCurrentChatroom(null);
  };

  const handleSaveProfile = async e => {
    e.preventDefault();
    await updateProfile(auth.currentUser, {
      displayName: newDisplayName,
      // photoURL: newPhotoURL,
    });
    const data = {
      displayName: newDisplayName ? newDisplayName : currentUser.displayName,
      about: newAbout,
      photoURL: newPhotoURL ? newPhotoURL : currentUser.photoURL,
      firstName: newFirstName,
      lastName: newLastName,
      url: newURL,
      company: newCompany,
    };
    await set(ref(db, `users/${currentUser.uid}`), data);
    setCurrentUser({ ...data, uid: auth.currentUser.uid, email: auth.currentUser.email });
    window.alert("Profile update successfull!");
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
                <div className="flex items-center justify-center flex-shrink-0 px-4">
                  <img className="h-8 w-auto" src="https://i.imgur.com/ocnQA4K.png" alt="Logo" />
                </div>
                <nav className="mt-5 flex-1 px-2 space-y-1">
                  {chatroom && (
                    <div>
                      {chatroom.map(item => (
                        <a
                          onClick={e => {
                            setCurrentChatroom(e.target.id);
                            setOpenProfile(false);
                          }}
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
                        <img className="inline-block h-10 w-10 rounded-full" src={currentUser.photoURL} alt="P" />
                      </div>
                    )}
                    {currentUser && currentUser.photoURL == null && (
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-500">
                        <span className="font-medium leading-none text-white">
                          {currentUser.displayName[0].toUpperCase()}
                        </span>
                      </span>
                    )}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">
                        {currentUser ? currentUser.displayName : ""}
                      </p>
                      <button
                        onClick={handleViewProfile}
                        className="text-xs font-medium text-gray-300 group-hover:text-gray-200">
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
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto ">
            <div className="flex items-center justify-center flex-shrink-0 px-4">
              <img className="h-8 w-auto" src="https://i.imgur.com/ocnQA4K.png" alt="Logo" />
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {chatroom && (
                <div>
                  {chatroom.map(item => (
                    <a
                      onClick={e => {
                        setCurrentChatroom(e.target.id);
                        setOpenProfile(false);
                      }}
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
                    <img className="inline-block h-10 w-10 rounded-full" src={currentUser.photoURL} alt="P" />
                  </div>
                )}
                {currentUser && currentUser.photoURL == null && (
                  <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-500">
                    <span className="font-medium leading-none text-white">
                      {currentUser.displayName[0].toUpperCase()}
                    </span>
                  </span>
                )}
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{currentUser ? currentUser.displayName : ""}</p>
                  <button
                    onClick={handleViewProfile}
                    className="text-xs font-medium text-gray-300 group-hover:text-gray-200">
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
              {openProfile && (
                <form className="divide-y divide-gray-200 lg:col-span-9">
                  {/* Profile section */}
                  <div className="py-6 px-4 sm:p-6 lg:pb-8">
                    <div>
                      <h2 className="text-lg leading-6 font-medium text-gray-900">Profile</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        This information will be displayed publicly so be careful what you share.
                      </p>
                    </div>

                    <div className="mt-6 flex flex-col lg:flex-row">
                      <div className="flex-grow space-y-6">
                        <div>
                          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                          </label>
                          <div className="mt-1 rounded-md shadow-sm flex">
                            <input
                              onChange={e => setNewDisplayName(e.target.value)}
                              type="text"
                              name="username"
                              id="username"
                              autoComplete="username"
                              className="focus:ring-sky-500 focus:border-sky-500 flex-grow block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-gray-300"
                              defaultValue={currentUser.displayName}
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="about" className="block text-sm font-medium text-gray-700">
                            About
                          </label>
                          <div className="mt-1">
                            <textarea
                              onChange={e => setNewAbout(e.target.value)}
                              id="about"
                              name="about"
                              rows={3}
                              className="shadow-sm focus:ring-sky-500 focus:border-sky-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                              defaultValue={currentUser.about}
                            />
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            Brief description for your profile. URLs are hyperlinked.
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex-grow lg:mt-0 lg:ml-6 lg:flex-grow-0 lg:flex-shrink-0">
                        <p className="text-sm font-medium text-gray-700" aria-hidden="true">
                          Photo
                        </p>
                        <div className="mt-1 lg:hidden">
                          <div className="flex items-center">
                            <div
                              className="flex-shrink-0 inline-block rounded-full overflow-hidden h-12 w-12"
                              aria-hidden="true">
                              <img
                                className="rounded-full h-full w-full"
                                src={newPhotoURL ? newPhotoURL : currentUser.photoURL}
                                alt=""
                              />
                            </div>
                            <div className="ml-5 rounded-md shadow-sm">
                              <div className="group relative border border-gray-300 rounded-md py-2 px-3 flex items-center justify-center hover:bg-gray-50 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500">
                                <label
                                  htmlFor="mobile-user-photo"
                                  className="relative text-sm leading-4 font-medium text-gray-700 pointer-events-none">
                                  <span>Change</span>
                                  <span className="sr-only"> user photo</span>
                                </label>
                                <input
                                  onChange={e => {
                                    const reader = new FileReader();
                                    reader.readAsDataURL(e.target.files[0]);
                                    reader.addEventListener(
                                      "load",
                                      function () {
                                        setNewPhotoURL(reader.result);
                                      },
                                      false
                                    );
                                  }}
                                  id="mobile-user-photo"
                                  name="user-photo"
                                  type="file"
                                  className="absolute w-full h-full opacity-0 cursor-pointer border-gray-300 rounded-md"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="hidden relative rounded-full overflow-hidden lg:block">
                          <img
                            className="relative rounded-full w-40 h-40"
                            src={newPhotoURL ? newPhotoURL : currentUser.photoURL}
                            alt=""
                          />
                          <label
                            htmlFor="desktop-user-photo"
                            className="absolute inset-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center text-sm font-medium text-white opacity-0 hover:opacity-100 focus-within:opacity-100">
                            <span>Change</span>
                            <span className="sr-only"> user photo</span>
                            <input
                              onChange={e => {
                                const reader = new FileReader();
                                reader.readAsDataURL(e.target.files[0]);
                                reader.addEventListener(
                                  "load",
                                  function () {
                                    setNewPhotoURL(reader.result);
                                  },
                                  false
                                );
                              }}
                              type="file"
                              id="desktop-user-photo"
                              name="user-photo"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer border-gray-300 rounded-md"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-12 gap-6">
                      <div className="col-span-12 sm:col-span-6">
                        <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
                          First name
                        </label>
                        <input
                          onChange={e => setNewFirstName(e.target.value)}
                          defaultValue={currentUser.firstName}
                          type="text"
                          name="first-name"
                          id="first-name"
                          autoComplete="given-name"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        />
                      </div>

                      <div className="col-span-12 sm:col-span-6">
                        <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
                          Last name
                        </label>
                        <input
                          onChange={e => setNewLastName(e.target.value)}
                          defaultValue={currentUser.lastName}
                          type="text"
                          name="last-name"
                          id="last-name"
                          autoComplete="family-name"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        />
                      </div>

                      <div className="col-span-12">
                        <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                          URL
                        </label>
                        <input
                          onChange={e => setNewURL(e.target.value)}
                          defaultValue={currentUser.url}
                          type="text"
                          name="url"
                          id="url"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        />
                      </div>

                      <div className="col-span-12 sm:col-span-6">
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                          Company
                        </label>
                        <input
                          onChange={e => setNewCompany(e.target.value)}
                          defaultValue={currentUser.company}
                          type="text"
                          name="company"
                          id="company"
                          autoComplete="organization"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-4 py-4 px-4 flex justify-end sm:px-6">
                      <button
                        onClick={handleSaveProfile}
                        className="ml-5 bg-sky-700 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              )}
              {!openProfile && (
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
                                                {message.name[0].toUpperCase()}
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
                                                {message.name[0].toUpperCase()}
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
              )}
              {/* /End replace */}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Home;
