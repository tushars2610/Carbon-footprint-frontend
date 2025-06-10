"use client";
// import { useState } from "react";
import CountryMap from "./CountryMap";

export default function DemographicCard() {
  // const [isOpen, setIsOpen] = useState(false);


  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 lg:p-8">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:text-xl xl:text-2xl">
            World Demographic
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400 lg:text-base">
            Least emission countries
          </p>
        </div>

        {/* <div className="relative inline-block">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div> */}
      </div>
      
      {/* Enhanced map container with better responsive sizing */}
      <div className="px-4 py-6 my-6 overflow-hidden border border-gary-200 rounded-2xl bg-gray-50 dark:border-gray-800 dark:bg-gray-900 sm:px-6 lg:px-8 lg:py-8">
        <div
          id="mapOne"
          className="mapOne map-btn -mx-4 -my-6 sm:-mx-6 lg:-mx-8 lg:-my-8
                     h-[212px] w-full
                     sm:h-[280px]
                     md:h-[350px]
                     lg:h-[420px]
                     xl:h-[480px]
                     2xl:h-[520px]
                     min-w-[252px]"
        >
          <CountryMap />
        </div>
      </div>

      {/* Enhanced statistics section with better spacing */}
      {/* <div className="space-y-5 lg:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="items-center w-full rounded-full max-w-8 lg:max-w-12">
              <Image
                width={48}
                height={48}
                src="/images/country/country-01.svg"
                alt="usa"
                className="w-full lg:w-12 lg:h-12"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90 lg:text-base xl:text-lg">
                USA
              </p>
              <span className="block text-gray-500 text-theme-xs dark:text-gray-400 lg:text-sm">
                2,379 Customers
              </span>
            </div>
          </div>

          <div className="flex w-full max-w-[140px] items-center gap-3 lg:max-w-[180px] lg:gap-4">
            <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800 lg:h-3 lg:max-w-[140px]">
              <div className="absolute left-0 top-0 flex h-full w-[79%] items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90 lg:text-base">
              79%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="items-center w-full rounded-full max-w-8 lg:max-w-12">
              <Image
                width={48}
                height={48}
                className="w-full lg:w-12 lg:h-12"
                src="/images/country/country-02.svg"
                alt="france"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90 lg:text-base xl:text-lg">
                France
              </p>
              <span className="block text-gray-500 text-theme-xs dark:text-gray-400 lg:text-sm">
                589 Customers
              </span>
            </div>
          </div>

          <div className="flex w-full max-w-[140px] items-center gap-3 lg:max-w-[180px] lg:gap-4">
            <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800 lg:h-3 lg:max-w-[140px]">
              <div className="absolute left-0 top-0 flex h-full w-[23%] items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90 lg:text-base">
              23%
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
}