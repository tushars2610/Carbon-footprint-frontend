"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";

import React, { useState, useEffect} from "react";

// Valid credentials
const VALID_CREDENTIALS = [
  { email: "ai@demo.com", password: "demo1234" },
  { email: "ai@mobiloitte.com", password: "mobi1234" },
  { email: "ai@user.com", password: "user1234" },
  { email: "singhtushar1970@gmail.com", password: "ts26102003" },
];

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if user is logging out
  useEffect(() => {
    const isLoggingOut = sessionStorage.getItem('isLoggingOut') === 'true';
    if (isLoggingOut) {
      // Clear all stored data
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('chatbot_messages');
      sessionStorage.removeItem('chatbot_welcome_shown');
      sessionStorage.removeItem('isLoggingOut');
    }
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      // Check credentials
      const isValidCredential = VALID_CREDENTIALS.some(
        cred => email.trim() === cred.email && password.trim() === cred.password
      );
      
      if (isValidCredential) {
        // Store authentication state
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', email.trim());
        
        // Set authentication cookie with secure flags
        document.cookie = `isAuthenticated=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
        
        // Get the redirect URL from query params or default to home
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get('from') || '/';
        
        // Force a hard redirect instead of using router.push
        window.location.href = redirectTo;
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSignIn(); }}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input 
                    placeholder="info@gmail.com" 
                    type="email" 
                    defaultValue={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      defaultValue={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                
                {error && (
                  <div className="text-sm text-error-500">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={handleSignIn}
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
