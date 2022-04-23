import React, { useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";

import { Dialog, Transition } from "@headlessui/react";
import { HomeIcon, LogoutIcon, CogIcon, XIcon, MenuIcon } from "@heroicons/react/outline";
import { PlusSmIcon } from "@heroicons/react/solid";

import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { ref, onValue, set } from "firebase/database";

const chatroom = [{ name: "Pulic", icon: HomeIcon, current: true }];

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState(null);

  const navigate = useNavigate();

  onValue(
    ref(db, `rooms/public/messages`),
    snapshot => {
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

  onAuthStateChanged(auth, user => {
    if (user) {
      setCurrentUser(user);
    } else {
      navigate("/");
    }
  });

  const handleLogout = e => {
    e.preventDefault();
    signOut(auth);
    navigate("/");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const newMessage = document.getElementById("newMessage").value;
    document.getElementById("newMessage").value = "";
    const newId = guid();
    const data = {
      text: newMessage,
      createdAt: new Date().toLocaleString(),
      createdBy: currentUser.uid,
      name: currentUser.displayName,
      photo: currentUser.photoURL,
    };
    await set(ref(db, `rooms/public/messages/${newId}`), data);
  };

  return (
    <div>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 flex z-40 md:hidden" onClose={setSidebarOpen}>
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
                    onClick={() => setSidebarOpen(false)}>
                    <span className="sr-only">Close sidebar</span>
                    <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <img
                    className="h-8 w-auto"
                    src="https://tailwindui.com/img/logos/workflow-logo-indigo-500-mark-white-text.svg"
                    alt="Workflow"
                  />
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  {chatroom.map(item => (
                    <a
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        item.current
                          ? "bg-gray-900 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white",
                        "group flex items-center px-2 py-2 text-base font-medium rounded-md"
                      )}>
                      <item.icon
                        className={classNames(
                          item.current ? "text-gray-300" : "text-gray-400 group-hover:text-gray-300",
                          "mr-4 flex-shrink-0 h-6 w-6"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </a>
                  ))}
                </nav>
              </div>
              <div className="flex-shrink-0 flex bg-gray-700 p-4">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    <div>
                      <img
                        className="inline-block h-9 w-9 rounded-full"
                        src={currentUser ? currentUser.photoURL : ""}
                        alt=""
                      />
                    </div>
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
          <div className="flex-shrink-0 w-14">{/* Force sidebar to shrink to fit close icon */}</div>
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
              {chatroom.map(item => (
                <a
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.current ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                  )}>
                  <item.icon
                    className={classNames(
                      item.current ? "text-gray-300" : "text-gray-400 group-hover:text-gray-300",
                      "mr-3 flex-shrink-0 h-6 w-6"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </a>
              ))}
            </nav>
            <div className="relative">
              <div className="relative flex justify-center">
                <button
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
                <div>
                  <img
                    className="inline-block h-9 w-9 rounded-full"
                    src={currentUser ? currentUser.photoURL : ""}
                    alt=""
                  />
                </div>
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
            onClick={() => setSidebarOpen(true)}>
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
                          Public
                        </h1>
                        <button>
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
                                    <div className="flex space-x-3">
                                      <div className="flex-shrink-0">
                                        <img className="h-10 w-10 rounded-full" src={message.photo} alt="" />
                                      </div>
                                      <div>
                                        <div className="text-sm">
                                          <a href="#" className="font-medium text-gray-900">
                                            {message.name}{" "}
                                            <span className="text-gray-500 font-medium text-xs">
                                              {message.createdAt}
                                            </span>{" "}
                                          </a>
                                        </div>
                                        <div className="mt-1 text-sm text-gray-700">
                                          <p>{message.text}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {currentUser.uid == message.createdBy && (
                                    <div className="flex space-x-3 align-center justify-end">
                                      <div>
                                        <div className="text-sm">
                                          <a href="#" className="font-medium text-gray-900">
                                            <span className="text-gray-500 font-medium text-xs">
                                              {message.createdAt}
                                            </span>{" "}
                                            {message.name}{" "}
                                          </a>
                                        </div>
                                        <div className="mt-1 text-sm text-gray-700">
                                          <p>{message.text}</p>
                                        </div>
                                      </div>
                                      <div className="flex-shrink-0">
                                        <img className="h-10 w-10 rounded-full" src={message.photo} alt="" />
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
                                id="newMessage"
                                rows={3}
                                className="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md"
                              />
                            </div>
                            <div className="mt-3 flex items-center justify-end">
                              <button
                                onClick={handleSubmit}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Comment
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
    </div>
  );
};

export default Home;
