import React, { useState } from "react";
import { X, Send, ShieldCheck, Mail, MapPin, Phone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tab: "contact" | "shipping" | "returns" | "size-guide" | "lookbook";
}

export default function InfoModal({ isOpen, onClose, tab }: InfoModalProps) {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });

  if (!isOpen) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactForm.name && contactForm.email && contactForm.message) {
      setFormSubmitted(true);
      setTimeout(() => {
        setFormSubmitted(false);
        setContactForm({ name: "", email: "", message: "" });
        onClose();
      }, 3000);
    }
  };

  const renderContent = () => {
    switch (tab) {
      case "contact":
        return (
          <div className="space-y-6">
            <div className="border-b border-black/10 pb-4">
              <span className="font-mono text-[0.65rem] tracking-[0.2em] text-[#A68966] uppercase font-bold">Get In Touch</span>
              <h3 className="font-serif text-2xl font-light text-[#111111] mt-1">Hubungi A-GIN Studio</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Direct info */}
              <div className="space-y-4 text-[0.8rem] font-light leading-relaxed text-[#111111]/70">
                <p>
                  Tim Customer Care kami siap membantu Anda setiap hari (Senin - Minggu, 09:00 - 21:00 WIB). Silakan kirimkan pesan Anda melalui formulir atau hubungi kontak di bawah ini.
                </p>
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#111111]">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-mono text-[0.6rem] uppercase tracking-wider text-[#A68966] font-bold">Email</p>
                      <a href="mailto:support@a-gin.studio" className="font-medium hover:text-[#A68966] transition-colors">support@a-gin.studio</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#111111]">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-mono text-[0.6rem] uppercase tracking-wider text-[#A68966] font-bold">WhatsApp Hotline</p>
                      <a href="https://wa.me/6281219154973" target="_blank" rel="noreferrer" className="font-medium hover:text-[#A68966] transition-colors">+62 812-1915-4973</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#111111]">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-mono text-[0.6rem] uppercase tracking-wider text-[#A68966] font-bold">HQ Studio Location</p>
                      <p className="font-medium">Kebayoran Baru, Jakarta Selatan, Indonesia</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Contact form */}
              <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-black/5">
                {formSubmitted ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-8">
                    <div className="w-12 h-12 bg-[#111111] text-white rounded-full flex items-center justify-center text-lg">✓</div>
                    <p className="font-mono text-[0.7rem] uppercase tracking-widest text-emerald-700 font-bold">Message Sent!</p>
                    <p className="text-[0.75rem] text-[#1B1B1B]/60 font-light">
                      Terima kasih atas pesan Anda. Tim kami akan merespons dalam waktu 1x24 jam.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="font-mono text-[0.55rem] uppercase tracking-widest text-[#111111]/60 block mb-1">Nama Lengkap</label>
                      <input 
                        type="text" 
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Andi Pratama" 
                        className="w-full bg-white border border-black/10 rounded-full px-4 py-2.5 text-[0.8rem] focus:outline-none focus:border-[#A68966]" 
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[0.55rem] uppercase tracking-widest text-[#111111]/60 block mb-1">Alamat Email</label>
                      <input 
                        type="email" 
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="andi@example.com" 
                        className="w-full bg-white border border-black/10 rounded-full px-4 py-2.5 text-[0.8rem] focus:outline-none focus:border-[#A68966]" 
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[0.55rem] uppercase tracking-widest text-[#111111]/60 block mb-1">Isi Pesan Anda</label>
                      <textarea 
                        required
                        rows={3}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Tanyakan detail ukuran, sablon kustom, dll..." 
                        className="w-full bg-white border border-black/10 rounded-2xl px-4 py-3 text-[0.8rem] focus:outline-none focus:border-[#A68966] resize-none" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-[#111111] text-white font-mono text-[0.65rem] uppercase tracking-[0.15em] font-bold py-3 rounded-full hover:bg-[#111111]/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      Kirim Pesan
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        );

      case "shipping":
        return (
          <div className="space-y-6">
            <div className="border-b border-black/10 pb-4">
              <span className="font-mono text-[0.65rem] tracking-[0.2em] text-[#A68966] uppercase font-bold">Logistics Support</span>
              <h3 className="font-serif text-2xl font-light text-[#111111] mt-1">Pengiriman & Logistik</h3>
            </div>
            
            <div className="space-y-4 text-[0.8rem] font-light leading-relaxed text-[#111111]/80">
              <p>
                A-GIN Studio berkomitmen memberikan layanan pengiriman yang cepat, aman, dan dapat dilacak sepenuhnya ke seluruh penjuru Nusantara.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl border border-black/5 bg-[#FAF7F2] space-y-2">
                  <span className="text-lg">🚚</span>
                  <h4 className="font-mono text-[0.65rem] uppercase tracking-wider font-bold text-[#111111]">Metode Pengiriman Regular</h4>
                  <p className="text-[0.75rem] text-[#111111]/60">
                    Bekerja sama dengan JNE, J&T, dan Sicepat. Pengiriman memakan waktu 1-3 hari kerja untuk wilayah Pulau Jawa, dan 3-7 hari kerja untuk luar Pulau Jawa.
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-black/5 bg-[#FAF7F2] space-y-2">
                  <span className="text-lg">⚡</span>
                  <h4 className="font-mono text-[0.65rem] uppercase tracking-wider font-bold text-[#111111]">Instant & Same Day</h4>
                  <p className="text-[0.75rem] text-[#111111]/60">
                    Untuk wilayah JABODETABEK tersedia layanan GrabExpress dan GoSend Instant/Same-Day dengan tarif flat yang transparan dan aman.
                  </p>
                </div>
              </div>

              <div className="border-t border-black/10 pt-4 space-y-3">
                <h4 className="font-mono text-[0.65rem] uppercase tracking-wider font-bold text-[#A68966]">Ketentuan Gratis Ongkir</h4>
                <div className="flex items-start gap-2.5 text-[0.75rem] text-[#111111]/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p>Gratis Ongkir otomatis berlaku untuk setiap pembelanjaan dengan total transaksi di atas **Rp 500.000,-** ke seluruh wilayah Indonesia.</p>
                </div>
                <div className="flex items-start gap-2.5 text-[0.75rem] text-[#111111]/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p>Nomor Resi Pelacakan (Tracking ID) akan diinfokan secara otomatis melalui Email dan WhatsApp terdaftar sesaat setelah paket diserahkan ke kurir.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "returns":
        return (
          <div className="space-y-6">
            <div className="border-b border-black/10 pb-4">
              <span className="font-mono text-[0.65rem] tracking-[0.2em] text-[#A68966] uppercase font-bold">Worry-Free Policy</span>
              <h3 className="font-serif text-2xl font-light text-[#111111] mt-1">Kebijakan Pengembalian & Penukaran</h3>
            </div>
            
            <div className="space-y-4 text-[0.8rem] font-light leading-relaxed text-[#111111]/80">
              <p>
                Kepuasan Anda adalah prioritas utama kami. Jika ukuran tidak pas atau produk mengalami cacat produksi, kami menyediakan garansi **30 hari penukaran gratis**.
              </p>

              <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-black/5 space-y-3">
                <h4 className="font-mono text-[0.65rem] uppercase tracking-wider font-bold text-[#111111]">Syarat & Ketentuan Pengembalian:</h4>
                <ul className="list-disc pl-5 text-[0.75rem] text-[#111111]/75 space-y-2">
                  <li>Produk harus dalam kondisi baru, belum dicuci, dan tidak ada bau parfum eksternal.</li>
                  <li>Tag label harga (price tag) dan kemasan eksklusif A-GIN masih terpasang utuh.</li>
                  <li>Melampirkan bukti transaksi atau nomor pesanan Anda.</li>
                  <li>Untuk cacat produk / salah kirim, wajib melampirkan video unboxing singkat demi keamanan bersama.</li>
                </ul>
              </div>

              <div className="pt-2">
                <h4 className="font-mono text-[0.65rem] uppercase tracking-wider font-bold text-[#A68966] mb-2">Cara Mengajukan Klaim:</h4>
                <p className="text-[0.75rem] text-[#111111]/60">
                  Silakan hubungi WhatsApp customer care kami di **+62 812-1915-4973**. Tim kami akan memandu Anda untuk penjemputan barang dan pengiriman produk pengganti tanpa biaya tambahan.
                </p>
              </div>
            </div>
          </div>
        );

      case "size-guide":
        return (
          <div className="space-y-6">
            <div className="border-b border-black/10 pb-4">
              <span className="font-mono text-[0.65rem] tracking-[0.2em] text-[#A68966] uppercase font-bold">Measurement Chart</span>
              <h3 className="font-serif text-2xl font-light text-[#111111] mt-1">Panduan Ukuran (Size Guide)</h3>
            </div>
            
            <p className="text-[0.8rem] font-light text-[#111111]/70">
              Semua busana kami dirancang dengan potongan modern yang presisi. Gunakan tabel di bawah ini untuk menentukan ukuran yang paling pas untuk bentuk tubuh Anda.
            </p>

            {/* Sizing Table */}
            <div className="overflow-x-auto rounded-xl border border-black/5">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-black/5 font-mono text-[0.6rem] uppercase tracking-widest text-[#A68966]">
                    <th className="p-3 text-center">Ukuran</th>
                    <th className="p-3">Lebar Dada (cm)</th>
                    <th className="p-3">Panjang Badan (cm)</th>
                    <th className="p-3">Panjang Lengan (cm)</th>
                    <th className="p-3">Estimasi TB (cm)</th>
                    <th className="p-3">Estimasi BB (kg)</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-[0.75rem] text-[#111111]/80 divide-y divide-black/5">
                  <tr>
                    <td className="p-3 font-bold text-center bg-[#FAF7F2]/30 text-sm">S</td>
                    <td className="p-3">48 - 50</td>
                    <td className="p-3">68 - 70</td>
                    <td className="p-3">21 - 22</td>
                    <td className="p-3">150 - 165</td>
                    <td className="p-3">45 - 55</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-center bg-[#FAF7F2]/30 text-sm">M</td>
                    <td className="p-3">51 - 53</td>
                    <td className="p-3">71 - 73</td>
                    <td className="p-3">22 - 23</td>
                    <td className="p-3">160 - 175</td>
                    <td className="p-3">56 - 65</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-center bg-[#FAF7F2]/30 text-sm">L</td>
                    <td className="p-3">54 - 56</td>
                    <td className="p-3">74 - 76</td>
                    <td className="p-3">23 - 24</td>
                    <td className="p-3">170 - 180</td>
                    <td className="p-3">66 - 78</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-center bg-[#FAF7F2]/30 text-sm">XL</td>
                    <td className="p-3">57 - 59</td>
                    <td className="p-3">77 - 79</td>
                    <td className="p-3">24 - 25</td>
                    <td className="p-3">175 - 188</td>
                    <td className="p-3">79 - 90</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-center bg-[#FAF7F2]/30 text-sm">XXL</td>
                    <td className="p-3">60 - 62</td>
                    <td className="p-3">80 - 82</td>
                    <td className="p-3">25 - 26</td>
                    <td className="p-3">180 - 195</td>
                    <td className="p-3">91 - 105</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[0.65rem] italic text-[#111111]/50 leading-relaxed">
              *Toleransi jahitan sekitar 1-2 cm wajar terjadi pada proses pemotongan manual kain garmen modern.
            </p>
          </div>
        );

      case "lookbook":
        return (
          <div className="space-y-6">
            <div className="border-b border-black/10 pb-4">
              <span className="font-mono text-[0.65rem] tracking-[0.2em] text-[#A68966] uppercase font-bold">Fashion Showcase</span>
              <h3 className="font-serif text-2xl font-light text-[#111111] mt-1">A-GIN Studio Lookbook</h3>
            </div>
            
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-black/10 shadow-lg">
              <iframe 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ"
                title="A-GIN Fashion Lookbook Video"
                referrerPolicy="no-referrer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
              ></iframe>
            </div>

            <div className="space-y-2 text-center max-w-md mx-auto pt-2">
              <p className="font-mono text-[0.65rem] tracking-[0.25em] text-[#A68966] uppercase font-semibold">Volume IV / Infinite Serenity</p>
              <p className="text-[0.75rem] text-[#111111]/70 font-light leading-relaxed">
                Koleksi editorial premium yang menggabungkan kesederhanaan minimalis dengan detail batik eksotis bernuansa modern, direkam eksklusif di Jakarta 2026.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dark Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs" 
      />
      
      {/* Modal Dialog Body */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-[#FBF9F6] text-[#1B1B1B] w-full max-w-2xl rounded-[2rem] shadow-2xl relative overflow-hidden p-6 sm:p-10 border border-[#111111]/10 z-10"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 text-[#111111] flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {renderContent()}
      </motion.div>
    </div>
  );
}
