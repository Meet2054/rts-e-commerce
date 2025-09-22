import countries from 'world-countries';

export interface Country {
  code: string;
  name: string;
  states?: State[];
}

export interface State {
  code: string;
  name: string;
}

export interface PostalCodeResult {
  country?: string;
  countryCode?: string;
  state?: string;
  stateCode?: string;
  city?: string;
  valid: boolean;
}

// US States data
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

// Canadian Provinces data
const CA_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'YT', name: 'Yukon' }
];

// Indian States data
const IN_STATES = [
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CG', name: 'Chhattisgarh' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'DH', name: 'Dadra and Nagar Haveli' },
  { code: 'DD', name: 'Daman and Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JK', name: 'Jammu and Kashmir' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OR', name: 'Odisha' },
  { code: 'PY', name: 'Puducherry' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TS', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' }
];

// Get all countries sorted alphabetically
export const getAllCountries = (): Country[] => {
  return countries
    .map(country => ({
      code: country.cca2,
      name: country.name.common,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Get states for a specific country
export const getStatesByCountry = (countryCode: string): State[] => {
  switch (countryCode) {
    case 'US':
      return US_STATES;
    case 'CA':
      return CA_PROVINCES;
    case 'IN':
      return IN_STATES;
    default:
      return [];
  }
};

// Enhanced postal code lookup with ZIP code API
export const lookupPostalCode = async (postalCode: string): Promise<PostalCodeResult> => {
  try {
    // Clean the postal code
    const cleanedCode = postalCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    if (!cleanedCode) {
      return { valid: false };
    }

    // For US ZIP codes, use a free API
    if (/^\d{5}(\d{4})?$/.test(cleanedCode)) {
      try {
        const zipCode = cleanedCode.substring(0, 5);
        const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
        
        if (response.ok) {
          const data = await response.json();
          const place = data.places?.[0];
          
          if (place) {
            return {
              country: 'United States',
              countryCode: 'US',
              state: place['state'],
              stateCode: place['state abbreviation'],
              city: place['place name'],
              valid: true
            };
          }
        }
      } catch (error) {
        console.error('ZIP code lookup error:', error);
      }
    }

    // For Canadian postal codes
    if (/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(cleanedCode)) {
      try {
        const postalCodeFormatted = cleanedCode.replace(/(.{3})(.{3})/, '$1$2');
        const response = await fetch(`https://api.zippopotam.us/ca/${postalCodeFormatted}`);
        
        if (response.ok) {
          const data = await response.json();
          const place = data.places?.[0];
          
          if (place) {
            return {
              country: 'Canada',
              countryCode: 'CA',
              state: place['state'],
              stateCode: place['state abbreviation'],
              city: place['place name'],
              valid: true
            };
          }
        }
      } catch (error) {
        console.error('Canadian postal code lookup error:', error);
      }
    }

    // Fallback patterns for other countries
    const patterns = [
      { regex: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, country: 'GB', countryName: 'United Kingdom' },
      { regex: /^\d{5}$/, country: 'DE', countryName: 'Germany' },
      { regex: /^\d{6}$/, country: 'IN', countryName: 'India' },
      { regex: /^\d{4}$/, country: 'AU', countryName: 'Australia' }
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(cleanedCode)) {
        return {
          country: pattern.countryName,
          countryCode: pattern.country,
          valid: true
        };
      }
    }

    return { valid: false };
  } catch (error) {
    console.error('Postal code lookup error:', error);
    return { valid: false };
  }
};

// Get country name by code
export const getCountryByCode = (code: string): Country | undefined => {
  const country = countries.find(c => c.cca2 === code || c.cca3 === code);
  if (!country) return undefined;
  
  return {
    code: country.cca2,
    name: country.name.common,
  };
};

// Validate postal code format
export const isValidPostalCodeFormat = (postalCode: string, countryCode?: string): boolean => {
  const cleanedCode = postalCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  const countryPatterns: Record<string, RegExp> = {
    'US': /^\d{5}(\d{4})?$/,
    'CA': /^[A-Z]\d[A-Z]\d[A-Z]\d$/,
    'GB': /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/,
    'DE': /^\d{5}$/,
    'FR': /^\d{5}$/,
    'IN': /^\d{6}$/,
    'AU': /^\d{4}$/,
    'JP': /^\d{3}-?\d{4}$/,
    'IT': /^\d{5}$/,
    'ES': /^\d{5}$/
  };

  if (countryCode && countryPatterns[countryCode]) {
    return countryPatterns[countryCode].test(cleanedCode);
  }

  // If no country specified, check against all patterns
  return Object.values(countryPatterns).some(pattern => pattern.test(cleanedCode));
};