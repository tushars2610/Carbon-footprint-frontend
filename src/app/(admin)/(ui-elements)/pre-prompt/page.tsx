'use client';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import React, { useState, useEffect } from "react";
import Alert from "@/components/ui/alert/Alert";
import { getDomain, getBaseUrl } from '@/utils/domainConfig';

export default function PrePrompt() {
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [editedPrompt, setEditedPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [alertType, setAlertType] = useState<"success" | "error">("success");

  useEffect(() => {
    const fetchSystemPrompt = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail') || '';
        const domain = getDomain(userEmail);
        const baseUrl = getBaseUrl();

        const response = await fetch(`${baseUrl}/domain/${domain}/system-prompt`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setSystemPrompt(data.system_prompt);
        setEditedPrompt(data.system_prompt);
      } catch (error) {
        console.error('Error fetching system prompt:', error);
        setSystemPrompt("Error loading system prompt");
        setEditedPrompt("Error loading system prompt");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSystemPrompt();
  }, []);

  const handleSave = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail') || '';
      const domain = getDomain(userEmail);
      const baseUrl = getBaseUrl();

      const response = await fetch(`${baseUrl}/domain/${domain}/system-prompt`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: editedPrompt
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSystemPrompt(editedPrompt);
      setIsEditing(false);
      setAlertMessage(data.message);
      setAlertType("success");
      
      // Clear alert after 3 seconds
      setTimeout(() => {
        setAlertMessage("");
      }, 3000);
    } catch (error) {
      console.error('Error saving system prompt:', error);
      setAlertMessage("Error saving system prompt");
      setAlertType("error");
      
      // Clear alert after 3 seconds
      setTimeout(() => {
        setAlertMessage("");
      }, 3000);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedPrompt(systemPrompt);
    setIsEditing(false);
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Pre-prompt" />
      {alertMessage && (
        <div className="mb-4">
          <Alert
            variant={alertType}
            title={alertType === "success" ? "Success" : "Error"}
            message={alertMessage}
            showLink={false}
          />
        </div>
      )}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-5 flex flex-col gap-4 md:flex-row justify-between items-center">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            Pre-prompt
          </h3>
          <div className="flex items-center gap-2 text-gray-800 dark:text-white/90">
            {isEditing ? (
              <>
                <Button size="md" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button 
                  size="md" 
                  variant="primary" 
                  onClick={handleSave}
                  disabled={editedPrompt === systemPrompt}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button size="md" variant="primary" onClick={handleEdit}>
                Edit
              </Button>
            )}
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 xl:p-10">
          <div className="text-gray-800 dark:text-white/90 overflow-hidden rounded-
         border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]
         p-4
        ">
            {isLoading ? (
              <span>Loading system prompt...</span>
            ) : isEditing ? (
              <textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="w-full h-48 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            ) : (
              <span>{systemPrompt}</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
