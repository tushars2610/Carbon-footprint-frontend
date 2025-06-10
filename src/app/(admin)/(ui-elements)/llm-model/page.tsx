"use client";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import React, { useState } from "react";
import Radio from "@/components/form/input/Radio";

export default function LLMControl() {
  const [selectedValue, setSelectedValue] = useState<string>("option2");

  const handleRadioChange = (value: string) => {
    setSelectedValue(value);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="LLM Model" />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 xl:p-10">
          <div className="flex flex-wrap items-center gap-8">
            <Radio
              id="radio1"
              name="group1"
              value="option1"
              checked={selectedValue === "option1"}
              onChange={handleRadioChange}
              label="Mistral"
            />
            <Radio
              id="radio2"
              name="group1"
              value="option2"
              checked={selectedValue === "option2"}
              onChange={handleRadioChange}
              label="DeepSeek"
            />
            <Radio
              id="radio3"
              name="group1"
              value="option3"
              checked={selectedValue === "option3"}
              onChange={handleRadioChange}
              label="gpt-4-turbo"
              
            />
            <Radio
              id="radio4"
              name="group1"
              value="option4"
              checked={selectedValue === "option4"}
              onChange={handleRadioChange}
              label="LLAMA"
              
            />
            <Radio
              id="radio5"
              name="group1"
              value="option5"
              checked={selectedValue === "option5"}
              onChange={handleRadioChange}
              label="gpt-3.5-turbo"
              
            />
          </div>
        </div>
      </div>
    </div>
  );
}
