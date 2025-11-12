"use client"

import { MessageCircle } from "lucide-react"

export function WhatsAppFloat() {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hey, I have a business requirement")
    window.open(`https://wa.me/7417914565?text=${message}`, "_blank")
  }

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-all duration-200 animate-pulse md:hidden"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle size={24} />
    </button>
  )
}
