import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Country data with codes, names, and phone number patterns
const countries = [
  { code: "US", name: "United States", dialCode: "+1", pattern: /^\d{10}$/, placeholder: "2025551234" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", pattern: /^\d{10,11}$/, placeholder: "7911123456" },
  { code: "CA", name: "Canada", dialCode: "+1", pattern: /^\d{10}$/, placeholder: "4161234567" },
  { code: "AU", name: "Australia", dialCode: "+61", pattern: /^\d{9}$/, placeholder: "412345678" },
  { code: "DE", name: "Germany", dialCode: "+49", pattern: /^\d{10,12}$/, placeholder: "15123456789" },
  { code: "FR", name: "France", dialCode: "+33", pattern: /^\d{9}$/, placeholder: "612345678" },
  { code: "IT", name: "Italy", dialCode: "+39", pattern: /^\d{9,10}$/, placeholder: "3123456789" },
  { code: "ES", name: "Spain", dialCode: "+34", pattern: /^\d{9}$/, placeholder: "612345678" },
  { code: "NL", name: "Netherlands", dialCode: "+31", pattern: /^\d{9}$/, placeholder: "612345678" },
  { code: "BE", name: "Belgium", dialCode: "+32", pattern: /^\d{8,9}$/, placeholder: "12345678" },
  { code: "CH", name: "Switzerland", dialCode: "+41", pattern: /^\d{9}$/, placeholder: "791234567" },
  { code: "AT", name: "Austria", dialCode: "+43", pattern: /^\d{10,11}$/, placeholder: "6641234567" },
  { code: "SE", name: "Sweden", dialCode: "+46", pattern: /^\d{8,9}$/, placeholder: "701234567" },
  { code: "NO", name: "Norway", dialCode: "+47", pattern: /^\d{8}$/, placeholder: "12345678" },
  { code: "DK", name: "Denmark", dialCode: "+45", pattern: /^\d{8}$/, placeholder: "12345678" },
  { code: "FI", name: "Finland", dialCode: "+358", pattern: /^\d{8,9}$/, placeholder: "401234567" },
  { code: "IE", name: "Ireland", dialCode: "+353", pattern: /^\d{8,9}$/, placeholder: "851234567" },
  { code: "PT", name: "Portugal", dialCode: "+351", pattern: /^\d{9}$/, placeholder: "912345678" },
  { code: "LU", name: "Luxembourg", dialCode: "+352", pattern: /^\d{8,9}$/, placeholder: "691100088" },
  { code: "JP", name: "Japan", dialCode: "+81", pattern: /^\d{10,11}$/, placeholder: "9012345678" },
  { code: "KR", name: "South Korea", dialCode: "+82", pattern: /^\d{9,10}$/, placeholder: "1012345678" },
  { code: "CN", name: "China", dialCode: "+86", pattern: /^\d{11}$/, placeholder: "13812345678" },
  { code: "IN", name: "India", dialCode: "+91", pattern: /^\d{10}$/, placeholder: "9876543210" },
  { code: "SG", name: "Singapore", dialCode: "+65", pattern: /^\d{8}$/, placeholder: "81234567" },
  { code: "HK", name: "Hong Kong", dialCode: "+852", pattern: /^\d{8}$/, placeholder: "51234567" },
  { code: "MY", name: "Malaysia", dialCode: "+60", pattern: /^\d{9,10}$/, placeholder: "123456789" },
  { code: "TH", name: "Thailand", dialCode: "+66", pattern: /^\d{8,9}$/, placeholder: "812345678" },
  { code: "PH", name: "Philippines", dialCode: "+63", pattern: /^\d{10}$/, placeholder: "9171234567" },
  { code: "ID", name: "Indonesia", dialCode: "+62", pattern: /^\d{9,12}$/, placeholder: "81234567890" },
  { code: "VN", name: "Vietnam", dialCode: "+84", pattern: /^\d{9,10}$/, placeholder: "912345678" },
  { code: "BR", name: "Brazil", dialCode: "+55", pattern: /^\d{10,11}$/, placeholder: "11987654321" },
  { code: "MX", name: "Mexico", dialCode: "+52", pattern: /^\d{10}$/, placeholder: "5512345678" },
  { code: "AR", name: "Argentina", dialCode: "+54", pattern: /^\d{10}$/, placeholder: "1123456789" },
  { code: "CL", name: "Chile", dialCode: "+56", pattern: /^\d{8,9}$/, placeholder: "987654321" },
  { code: "CO", name: "Colombia", dialCode: "+57", pattern: /^\d{10}$/, placeholder: "3001234567" },
  { code: "PE", name: "Peru", dialCode: "+51", pattern: /^\d{9}$/, placeholder: "987654321" },
  { code: "ZA", name: "South Africa", dialCode: "+27", pattern: /^\d{9}$/, placeholder: "821234567" },
  { code: "EG", name: "Egypt", dialCode: "+20", pattern: /^\d{10}$/, placeholder: "1012345678" },
  { code: "NG", name: "Nigeria", dialCode: "+234", pattern: /^\d{10}$/, placeholder: "8012345678" },
  { code: "KE", name: "Kenya", dialCode: "+254", pattern: /^\d{9}$/, placeholder: "712345678" },
  { code: "MA", name: "Morocco", dialCode: "+212", pattern: /^\d{9}$/, placeholder: "612345678" },
  { code: "IL", name: "Israel", dialCode: "+972", pattern: /^\d{8,9}$/, placeholder: "501234567" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", pattern: /^\d{8,9}$/, placeholder: "501234567" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", pattern: /^\d{8,9}$/, placeholder: "501234567" },
  { code: "TR", name: "Turkey", dialCode: "+90", pattern: /^\d{10}$/, placeholder: "5321234567" },
  { code: "RU", name: "Russia", dialCode: "+7", pattern: /^\d{10}$/, placeholder: "9123456789" },
  { code: "UA", name: "Ukraine", dialCode: "+380", pattern: /^\d{9}$/, placeholder: "501234567" },
  { code: "PL", name: "Poland", dialCode: "+48", pattern: /^\d{9}$/, placeholder: "512345678" },
  { code: "CZ", name: "Czech Republic", dialCode: "+420", pattern: /^\d{9}$/, placeholder: "601234567" },
  { code: "HU", name: "Hungary", dialCode: "+36", pattern: /^\d{8,9}$/, placeholder: "201234567" },
  { code: "RO", name: "Romania", dialCode: "+40", pattern: /^\d{9}$/, placeholder: "712345678" },
  { code: "BG", name: "Bulgaria", dialCode: "+359", pattern: /^\d{8,9}$/, placeholder: "87123456" },
  { code: "HR", name: "Croatia", dialCode: "+385", pattern: /^\d{8,9}$/, placeholder: "912345678" },
  { code: "SI", name: "Slovenia", dialCode: "+386", pattern: /^\d{8}$/, placeholder: "31234567" },
  { code: "SK", name: "Slovakia", dialCode: "+421", pattern: /^\d{9}$/, placeholder: "901234567" },
  { code: "LT", name: "Lithuania", dialCode: "+370", pattern: /^\d{8}$/, placeholder: "61234567" },
  { code: "LV", name: "Latvia", dialCode: "+371", pattern: /^\d{8}$/, placeholder: "21234567" },
  { code: "EE", name: "Estonia", dialCode: "+372", pattern: /^\d{7,8}$/, placeholder: "5123456" },
  { code: "GR", name: "Greece", dialCode: "+30", pattern: /^\d{10}$/, placeholder: "6912345678" },
  { code: "CY", name: "Cyprus", dialCode: "+357", pattern: /^\d{8}$/, placeholder: "96123456" },
  { code: "MT", name: "Malta", dialCode: "+356", pattern: /^\d{8}$/, placeholder: "79123456" },
  { code: "IS", name: "Iceland", dialCode: "+354", pattern: /^\d{7}$/, placeholder: "6111234" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", pattern: /^\d{8,9}$/, placeholder: "211234567" }
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode: string;
  onCountryChange: (countryCode: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export function PhoneInput({
  value,
  onChange,
  countryCode,
  onCountryChange,
  placeholder,
  disabled = false,
  className,
  error
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isValid, setIsValid] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = countries.find(country => country.code === countryCode) || countries[0];

  // Filter countries based on search query
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Validate phone number based on selected country pattern
  useEffect(() => {
    if (value && selectedCountry) {
      const isValidNumber = selectedCountry.pattern.test(value.replace(/\s/g, ''));
      setIsValid(isValidNumber);
    } else {
      setIsValid(true);
    }
  }, [value, selectedCountry]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleCountrySelect = (country: typeof countries[0]) => {
    onCountryChange(country.code);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow only numbers, spaces, hyphens, and parentheses
    const cleanedValue = inputValue.replace(/[^\d\s\-\(\)]/g, '');
    onChange(cleanedValue);
  };

  const getFlag = (countryCode: string) => {
    // Using Unicode flag emojis
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        {/* Country Code Selector - More Compact and Square */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              // Base styling to match other form inputs
              "flex items-center justify-center h-10 px-2 py-2 text-sm font-medium",
              "bg-[#1a1a1a] border border-gray-600 border-r-0 rounded-l-md text-white",
              // Hover and focus states
              "hover:border-gray-400 focus:outline-none focus:border-gray-400 focus:ring-0",
              "transition-all duration-300",
              // Disabled state
              "disabled:cursor-not-allowed disabled:opacity-50",
              // Error state
              error && !isValid ? "border-red-500" : "",
              // More compact, square-like width - reduced from 120px to 80px
              "w-[80px] flex-shrink-0"
            )}
          >
            <div className="flex items-center space-x-1">
              <span className="text-sm">{getFlag(selectedCountry.code)}</span>
              <span className="font-mono text-xs text-gray-300 truncate">
                {selectedCountry.dialCode}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-gray-400 ml-1" />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 z-50 w-72 mt-1 bg-[#2a2a2a] border border-gray-600 rounded-md shadow-xl max-h-60 overflow-hidden">
              {/* Search Input */}
              <div className="p-3 border-b border-gray-600">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-[#1a1a1a] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Country List */}
              <div className="overflow-y-auto max-h-48">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 text-sm text-white hover:bg-[#1a1a1a] transition-colors duration-200",
                        selectedCountry.code === country.code && "bg-[#1a1a1a]"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-base">{getFlag(country.code)}</span>
                        <span className="truncate text-left">{country.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs text-gray-400">{country.dialCode}</span>
                        {selectedCountry.code === country.code && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2.5 text-sm text-gray-400">
                    No countries found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder || selectedCountry.placeholder}
          disabled={disabled}
          className={cn(
            // Base styling to match other form inputs exactly
            "flex-1 h-10 px-3 py-2 text-sm bg-[#1a1a1a] border border-gray-600 border-l-0 rounded-r-md text-white placeholder-gray-400",
            // Focus states
            "focus:outline-none focus:border-gray-400 focus:ring-0",
            "transition-all duration-300",
            // Disabled state
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Error state
            error && !isValid ? "border-red-500" : ""
          )}
        />
      </div>

      {/* Validation Message */}
      {error && !isValid && value && (
        <p className="mt-2 text-sm text-red-400">
          Please enter a valid phone number for {selectedCountry.name}
        </p>
      )}

      {/* Format Hint */}
      {value && isValid && (
        <p className="mt-1 text-xs text-gray-500">
          Format: {selectedCountry.dialCode} {selectedCountry.placeholder}
        </p>
      )}
    </div>
  );
}