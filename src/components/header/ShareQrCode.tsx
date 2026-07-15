"use client";

export default function ShareQrCode() {
  return (
    <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="10" fill="#ffffff" />
      <rect x="10" y="10" width="25" height="25" rx="3" stroke="#4f46e5" strokeWidth="6" fill="none" />
      <rect x="15" y="15" width="15" height="15" rx="1.5" fill="#4f46e5" />
      <rect x="65" y="10" width="25" height="25" rx="3" stroke="#4f46e5" strokeWidth="6" fill="none" />
      <rect x="70" y="15" width="15" height="15" rx="1.5" fill="#4f46e5" />
      <rect x="10" y="65" width="25" height="25" rx="3" stroke="#4f46e5" strokeWidth="6" fill="none" />
      <rect x="15" y="70" width="15" height="15" rx="1.5" fill="#4f46e5" />
      <rect x="45" y="15" width="6" height="6" fill="#09090b" />
      <rect x="52" y="10" width="6" height="12" fill="#09090b" />
      <rect x="45" y="25" width="12" height="6" fill="#4f46e5" />
      <rect x="70" y="45" width="6" height="12" fill="#09090b" />
      <rect x="80" y="52" width="6" height="6" fill="#09090b" />
      <rect x="15" y="45" width="12" height="6" fill="#09090b" />
      <rect x="25" y="52" width="6" height="10" fill="#4f46e5" />
      <rect x="42" y="42" width="16" height="16" rx="2" fill="#4f46e5" />
      <text x="50" y="52" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#ffffff" fontFamily="sans-serif">W2M</text>
      <rect x="45" y="65" width="12" height="6" fill="#09090b" />
      <rect x="45" y="75" width="6" height="12" fill="#09090b" />
      <rect x="54" y="80" width="10" height="6" fill="#4f46e5" />
      <rect x="70" y="70" width="15" height="15" fill="#09090b" />
    </svg>
  );
}
