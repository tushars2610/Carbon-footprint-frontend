'use client';

import Avatar from "@/components/ui/avatar/Avatar";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

// Custom hook for localStorage initialization
const useLocalStorage = (key: string, defaultValue: string) => {
  const [value, setValue] = useState(defaultValue);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        setValue(storedValue);
      }
      isFirstRender.current = false;
    }
  }, [key]);

  const updateValue = (newValue: string) => {
    setValue(newValue);
    localStorage.setItem(key, newValue);
  };

  return [value, updateValue] as const;
};

const AvatarSelector = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAvatarAlert, setShowAvatarAlert] = useState(false);
  const [showNameAlert, setShowNameAlert] = useState(false);
  const [selectedPath, setSelectedPath] = useState("");
  const [botName, setBotName] = useLocalStorage('chatbotName', 'Planet Pulse');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    // Auto-dismiss alerts after 3 seconds
    if (showAvatarAlert || showNameAlert) {
      const timer = setTimeout(() => {
        setShowAvatarAlert(false);
        setShowNameAlert(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAvatarAlert, showNameAlert]);

  const handleAvatarSelect = (avatarPath: string) => {
    setSelectedPath(avatarPath);
    setShowConfirmation(true);
  };

  const confirmSelection = () => {
    localStorage.setItem('selectedChatbotAvatar', selectedPath);
    window.dispatchEvent(new CustomEvent('avatarChanged', { detail: { avatarPath: selectedPath } }));
    setShowConfirmation(false);
    setShowAvatarAlert(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBotName(e.target.value);
  };

  const saveBotName = () => {
    window.dispatchEvent(new CustomEvent('botNameChanged', { detail: { name: botName } }));
    setIsEditingName(false);
    setShowNameAlert(true);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    const savedName = localStorage.getItem('chatbotName') || 'Planet Pulse';
    setBotName(savedName);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* Avatar Selection Section */}
      <div className="w-full border-2 p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Choose AI Agent Avatar</h3>
        <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center px-4 sm:px-20 gap-6">
          {/* Avatar Selection */}
          <div className="w-full sm:w-auto">
            <div className="flex flex-wrap justify-center sm:justify-start gap-5">
              {["Bot1", "Bot2", "Bot3", "Bot4"].map((bot, index) => (
                <div
                  key={index}
                  onClick={() => handleAvatarSelect(`/images/user/${bot}.png`)}
                  className="cursor-pointer"
                >
                  <Avatar
                    src={`/images/user/${bot}.png`}
                    size={index > 1 ? "xxlarge" : "xlarge"}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Avatar Confirmation Button */}
          <div className="w-full sm:w-auto flex justify-center sm:justify-end">
            <button
              onClick={confirmSelection}
              disabled={!showConfirmation}
              className={`px-4 py-2 rounded-md font-medium text-white ${showConfirmation
                ? '[background-color:#16A34A]'
                : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Bot Name Customization Section */}
      <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Customize AI Agent Name</h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          {isEditingName ? (
            <>
              <input
                type="text"
                value={botName}
                onChange={handleNameChange}
                className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bot name"
                maxLength={20}
              />
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={saveBotName}
                  className="flex-1 sm:flex-none px-4 py-2 text-white rounded-md [background-color:#16A34A] font-medium"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 sm:flex-none px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-full sm:flex-1 px-4 py-2 bg-gray-50 rounded-md">
                <span className="text-gray-800">{botName}</span>
              </div>
              <button
                onClick={() => setIsEditingName(true)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
              >
                Edit Name
              </button>
            </>
          )}
        </div>
      </div>

      {/* Avatar Confirmation Alert */}
      {showAvatarAlert && (
        <div className="fixed top-30 right-4 bg-white rounded-lg shadow-lg p-4 w-full max-w-sm z-50 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 relative rounded-full overflow-hidden">
              <Image
                src={selectedPath}
                alt="Selected Avatar"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div>
              <h3 className="text-md font-semibold text-gray-800">Avatar Updated</h3>
              <p className="text-sm text-gray-600">Your AI Agent avatar has been successfully changed!</p>
            </div>
          </div>
        </div>
      )}

      {/* Name Confirmation Alert */}
      {showNameAlert && (
        <div className="fixed top-30 right-4 bg-white rounded-lg shadow-lg p-4 w-full max-w-sm z-50 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-md font-semibold text-gray-800">Name Updated</h3>
              <p className="text-sm text-gray-600">Your AI Agent name has been changed to {botName}!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarSelector;