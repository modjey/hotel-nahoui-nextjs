"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Calendar, Users, BedDouble, Bath, Shield, Clock, Share2, Award, ChevronLeft, ChevronRight, X, Check, AlertCircle, Sparkles, Images } from "lucide-react";
import { format, addDays, differenceInDays, isWithinInterval, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { api } from "@/lib/api-client";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import HotelBookingCalendar, { type GuestCount, buildAvailabilityMap } from "@/components/site/HotelBookingCalendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type Room = {
  id: string;
  slug: string;
  name: string;
  roomNumber: string | null;
  description: string | null;
  shortDescription: string | null;
  basePrice: number;
  currency: string;
  maxGuests: number;
  beds: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  coverImageUrl: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  amenities: string[];
  checkInStart: string | null;
  checkInEnd: string | null;
  checkOutTime: string | null;
  checkInMethod: string | null;
  cancellationPolicy: string | null;
  roomType: { id: string; slug: string; name: string };
  location: { id: string; slug: string; name: string; city: string | null; mapLink: string | null };
  media: {
    id: string;
    type: string;
    url: string;
    thumbnailUrl: string | null;
    title: string | null;
    alt: string | null;
    order: number;
  }[];
};

function StayDetailPageContent() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params?.slug;
  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");
  const adultsParam = searchParams.get("adults");
  const childrenParam = searchParams.get("children");
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<Date | undefined>(() => checkInParam ? new Date(checkInParam) : addDays(new Date(), 14));
  const [checkOut, setCheckOut] = useState<Date | undefined>(() => checkOutParam ? new Date(checkOutParam) : addDays(new Date(), 17));
  const [adults, setAdults] = useState(() => adultsParam ? parseInt(adultsParam, 10) : 1);
  const [children, setChildren] = useState(() => childrenParam ? parseInt(childrenParam, 10) : 0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [guestPickerOpen, setGuestPickerOpen] = useState(false);
  const [mobileGuestPickerOpen, setMobileGuestPickerOpen] = useState(false);
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [conflictingBookings, setConflictingBookings] = useState<{ id: string; checkIn: string; checkOut: string; status: string }[]>([]);
  const [isOwnBooking, setIsOwnBooking] = useState(false);
  const [bookings, setBookings] = useState<{ id: string; checkIn: string; checkOut: string; status: string }[]>([]);
  const [bookingFlowOpen, setBookingFlowOpen] = useState(false);
  const [reviews, setReviews] = useState<{ id: string; rating: number; comment: string; user: { name: string; image?: string }; createdAt: string }[]>([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, approved: 0, total: 0 });
  const [showReviewForm, setShowReviewForm] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [user, setUser] = useState<{ id?: string; name?: string; email?: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPurpose, setAuthPurpose] = useState<"booking" | "review">("booking");
  const reviewSectionRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);
  const [savedRooms, setSavedRooms] = useState<string[]>([]);

  // Load saved rooms from localStorage (client-only)
  useEffect(() => {
    const saved = localStorage.getItem('savedRooms');
    setSavedRooms(saved ? JSON.parse(saved) : []);
  }, []);

  // Check if current room is saved
  const isRoomSaved = useMemo(() => savedRooms.includes(slug || ''), [savedRooms, slug]);

  useEffect(() => {
    setSaved(isRoomSaved);
  }, [isRoomSaved]);

  // Share functionality
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: room?.name || 'Chambre',
          text: room?.shortDescription || 'Découvrez cette chambre',
          url,
        });
        return;
      } catch {
        // User cancelled or API failed — fall through to clipboard copy
      }
    }
    // Copy to clipboard: use Clipboard API on HTTPS, execCommand fallback on HTTP
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success("Lien copié dans le presse-papier");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };


  // Restore booking flow state after OAuth redirect (client-only)
  useEffect(() => {
    if (localStorage.getItem('bookingFlowOpen') === 'true') {
      setBookingFlowOpen(true);
      localStorage.removeItem('bookingFlowOpen');
    }
  }, []);

  // Check authentication status
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ user: { id?: string; name?: string; email?: string } }>("/api/auth/me");
        setUser(data.user);
        // Scroll to review section if auth purpose was review
        if (authPurpose === "review" && reviewSectionRef.current) {
          setTimeout(() => {
            reviewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      } catch {
        setUser(null);
      }
    })();
  }, [authModalOpen, authPurpose]); // Re-check when auth modal closes

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const data = await api.get<{ room: Room }>(`/api/rooms/${slug}`);
        setRoom(data.room);
      } catch (err) {
        console.error("Erreur chargement chambre", err);
        setError("Chambre introuvable");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Check availability when dates change
  useEffect(() => {
    if (!slug || !checkIn || !checkOut) return;
    (async () => {
      setCheckingAvailability(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/rooms/${slug}/availability?checkIn=${checkIn.toISOString()}&checkOut=${checkOut.toISOString()}&userId=${user?.id || ''}`);
        const data = await res.json();
        if (data.success) {
          setAvailability(data.data.available);
          setConflictingBookings(data.data.conflictingBookings || []);
          setIsOwnBooking(data.data.isOwnBooking || false);
        }
      } catch (err) {
        console.error("Erreur vérification disponibilité", err);
        setAvailability(null);
      } finally {
        setCheckingAvailability(false);
      }
    })();
  }, [slug, checkIn, checkOut, user?.id]);

  // Fetch reviews for the room
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/rooms/${slug}/reviews?status=APPROVED`);
        const data = await res.json();
        if (data.success) {
          setReviews(data.data.reviews);
          setReviewStats(data.data.stats);
        }
      } catch (err) {
        console.error("Erreur chargement avis:", err);
      }
    })();
  }, [slug]);

  // Fetch bookings for the room to disable booked dates
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/rooms/${slug}/bookings`);
        const data = await res.json();
        if (data.success) {
          setBookings(data.data.bookings || []);
        }
      } catch (err) {
        console.error("Erreur chargement réservations:", err);
      }
    })();
  }, [slug]);

  // Nuits déjà réservées (le jour de départ reste disponible comme arrivée)
  const availabilityMap = useMemo(() => buildAvailabilityMap(bookings), [bookings]);

  // Submit review handler
  const handleSubmitReview = async () => {
    if (reviewRating === 0 || !reviewComment.trim()) {
      toast.error("Veuillez sélectionner une note et écrire un commentaire");
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/rooms/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Avis envoyé avec succès ! Il sera visible après modération.");
        setShowReviewForm(false);
        setReviewRating(0);
        setReviewComment("");
        // Refresh reviews
        const reviewsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/rooms/${slug}/reviews?status=APPROVED`);
        const reviewsData = await reviewsRes.json();
        if (reviewsData.success) {
          setReviews(reviewsData.data.reviews);
          setReviewStats(reviewsData.data.stats);
        }
      } else {
        toast.error(data.error?.message || "Erreur lors de l'envoi de l'avis");
      }
    } catch (err) {
      console.error("Erreur soumission avis:", err);
      toast.error("Erreur lors de l'envoi de l'avis");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <section className="mx-auto max-w-7xl px-6 lg:px-10 pt-10">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-96" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 lg:px-10 mt-6">
          <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[60vh] min-h-[420px] rounded-3xl overflow-hidden">
            <Skeleton className="col-span-2 row-span-2 h-full w-full" />
            <Skeleton className="h-full w-full" />
            <Skeleton className="h-full w-full" />
            <Skeleton className="h-full w-full" />
            <Skeleton className="h-full w-full" />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 lg:px-10 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-6 pb-8 border-b border-border">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 py-6 border-b border-border">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>

            <div className="py-6 border-b border-border space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            <div className="py-6 border-b border-border space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            <div className="py-6 border-b border-border space-y-4">
              <Skeleton className="h-8 w-64" />
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>

            <div className="py-6 border-b border-border space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
            </div>
          </div>

          <div className="space-y-4">
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </section>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-3xl">Chambre introuvable</h1>
          <Link href="/stays" className="text-primary underline mt-3 inline-block">Voir la collection</Link>
        </div>
      </div>
    );
  }

  // Build gallery from media (images and videos)
  const gallery = room.coverImageUrl
    ? [{ type: 'image' as const, url: room.coverImageUrl, isYoutube: false }, ...room.media.map((m) => ({ type: m.type.toLowerCase(), url: m.url, isYoutube: m.url.includes('youtube.com') || m.url.includes('youtu.be') }))]
    : room.media.map((m) => ({ type: m.type.toLowerCase(), url: m.url, isYoutube: m.url.includes('youtube.com') || m.url.includes('youtu.be') }));

  // Extract YouTube video ID from URL
  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const p = {
    id: room.slug,
    title: room.name,
    category: room.roomType.name,
    location: room.location.city ? `${room.location.city}, ${room.location.name}` : room.location.name,
    country: "Côte d&apos;Ivoire",
    price: room.basePrice,
    currency: room.currency,
    rating: reviewStats.approved > 0 ? reviewStats.averageRating : 0,
    reviews: reviewStats.approved,
    guests: room.maxGuests,
    beds: room.beds || 1,
    baths: room.bathrooms || 1,
    description: room.description || room.shortDescription || "",
    amenities: room.amenities,
    gallery: gallery.length > 0 ? gallery : [{ type: "image" as const, url: "/placeholder.jpg", isYoutube: false }],
    host: {
      name: "Hotel Nahoui",
      since: "2024",
      superhost: room.isFeatured,
    },
  };

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;

  const handleSelectionChange = (newCheckIn: Date | null, newCheckOut: Date | null) => {
    setCheckIn(newCheckIn ?? undefined);
    setCheckOut(newCheckOut ?? undefined);
  };

  const handleGuestsChange = (guests: GuestCount) => {
    const maxGuests = room?.maxGuests ?? guests.adults + guests.children;
    const nextAdults = Math.min(guests.adults, maxGuests);
    setAdults(nextAdults);
    setChildren(Math.min(guests.children, maxGuests - nextAdults));
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? p.gallery.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === p.gallery.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <section className="mx-auto max-w-7xl px-6 lg:px-10 pt-10">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <span className="eyebrow text-primary">{p.category}</span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl mt-3 font-light text-balance leading-[1.05]">
              {p.title}
              {room?.roomNumber && <span className="text-lg text-muted-foreground ml-3">N° {room.roomNumber}</span>}
            </h1>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-foreground text-foreground" /> <strong className="text-foreground">{p.rating.toFixed(2)}</strong> · {p.reviews} avis</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {p.location}, {p.country}</span>
              {p.host.superhost && <span className="flex items-center gap-1.5"><Award className="h-3.5 w-3.5" /> Superhôte</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleShare} className="h-10 px-4 border border-border text-sm flex items-center gap-2 hover:bg-secondary"><Share2 className="h-4 w-4"/> Partager</button>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 mt-6">
        {/* Mobile: single image with photo count */}
        <div className="sm:hidden relative aspect-[4/3] rounded-2xl overflow-hidden">
          {p.gallery[0].type === 'video' && p.gallery[0].isYoutube ? (
            <iframe src={`https://www.youtube.com/embed/${getYoutubeId(p.gallery[0].url)}?autoplay=1&mute=1&loop=1&playlist=${getYoutubeId(p.gallery[0].url)}`} className="h-full w-full object-cover" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : p.gallery[0].type === 'video' ? (
            <video src={p.gallery[0].url} className="h-full w-full object-cover" muted loop autoPlay />
          ) : (
            <img src={p.gallery[0].url} alt={p.title} className="h-full w-full object-cover" />
          )}
          <button onClick={() => { setCurrentImageIndex(0); setGalleryOpen(true); }} className="absolute inset-0" aria-label="Voir la galerie" />
          {p.gallery.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
              <Images className="h-3.5 w-3.5" />
              {p.gallery.length} photos
            </div>
          )}
        </div>
        {/* Desktop: 4-col grid */}
        <div className="hidden sm:grid grid-cols-4 grid-rows-2 gap-3 h-[60vh] min-h-[420px] rounded-3xl overflow-hidden">
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
            onClick={() => { setCurrentImageIndex(0); setGalleryOpen(true); }}
            className="col-span-2 row-span-2 h-full w-full relative group"
          >
            {p.gallery[0].type === 'video' && p.gallery[0].isYoutube ? (
              <iframe
                src={`https://www.youtube.com/embed/${getYoutubeId(p.gallery[0].url)}?autoplay=1&mute=1&loop=1&playlist=${getYoutubeId(p.gallery[0].url)}`}
                className="h-full w-full object-cover"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : p.gallery[0].type === 'video' ? (
              <video src={p.gallery[0].url} className="h-full w-full object-cover" controls muted loop autoPlay />
            ) : (
              <img src={p.gallery[0].url} alt={p.title} className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-medium">Voir toutes les photos</span>
            </div>
          </motion.button>
          {p.gallery.slice(1, 4).map((g: { type: string; url: string; isYoutube: boolean }, i: number) => (
            <motion.button
              key={i}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
              onClick={() => { setCurrentImageIndex(i + 1); setGalleryOpen(true); }}
              className="h-full w-full relative group"
            >
              {g.type === 'video' && g.isYoutube ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeId(g.url)}?mute=1&loop=1&playlist=${getYoutubeId(g.url)}`}
                  className="h-full w-full object-cover"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : g.type === 'video' ? (
                <video src={g.url} className="h-full w-full object-cover" muted loop />
              ) : (
                <img src={g.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium">Voir</span>
              </div>
            </motion.button>
          ))}
          {p.gallery.length > 4 && (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}
              onClick={() => { setCurrentImageIndex(4); setGalleryOpen(true); }}
              className="h-full w-full relative group"
            >
              {p.gallery[4].type === 'video' && p.gallery[4].isYoutube ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeId(p.gallery[4].url)}?mute=1&loop=1&playlist=${getYoutubeId(p.gallery[4].url)}`}
                  className="h-full w-full object-cover"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : p.gallery[4].type === 'video' ? (
                <video src={p.gallery[4].url} className="h-full w-full object-cover" muted loop />
              ) : (
                <img src={p.gallery[4].url} alt="" loading="lazy" className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-display text-2xl font-medium">+{p.gallery.length - 4}</span>
              </div>
            </motion.button>
          )}
        </div>
      </section>

      {/* Gallery Lightbox */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-6xl w-full h-[80vh] p-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">Galerie de photos</DialogTitle>
          <button
            onClick={() => setGalleryOpen(false)}
            className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={handlePrevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="w-full h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              {p.gallery[currentImageIndex].type === 'video' && p.gallery[currentImageIndex].isYoutube ? (
                <motion.iframe
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  src={`https://www.youtube.com/embed/${getYoutubeId(p.gallery[currentImageIndex].url)}?autoplay=1`}
                  className="w-full h-full object-contain"
                  style={{ aspectRatio: '16/9', maxWidth: '90vw', maxHeight: '90vh' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : p.gallery[currentImageIndex].type === 'video' ? (
                <motion.video
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  src={p.gallery[currentImageIndex].url}
                  controls
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <motion.img
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  src={p.gallery[currentImageIndex].url}
                  alt={`${p.title} - Photo ${currentImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </AnimatePresence>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {p.gallery.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className={`h-2 rounded-full transition-all ${i === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Content + booking */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-8 pb-28 lg:pb-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-6 pb-8 border-b border-border">
            <div className="h-14 w-14 rounded-full bg-secondary grid place-items-center font-display text-xl">{p.host.name[0]}</div>
            <div>
              <div className="font-display text-xl">Hébergé par {p.host.name}</div>
              <div className="text-sm text-muted-foreground">Hôte depuis {p.host.since}{p.host.superhost ? " · Superhôte" : ""}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 py-6 border-b border-border">
            <div className="flex items-center gap-3"><Users className="h-5 w-5 text-muted-foreground"/><div><div className="text-sm font-medium">{p.guests} voyageurs</div><div className="text-xs text-muted-foreground">Logement confortable</div></div></div>
            <div className="flex items-center gap-3"><BedDouble className="h-5 w-5 text-muted-foreground"/><div><div className="text-sm font-medium">{p.beds} chambres</div><div className="text-xs text-muted-foreground">Draps inclus</div></div></div>
            <div className="flex items-center gap-3"><Bath className="h-5 w-5 text-muted-foreground"/><div><div className="text-sm font-medium">{p.baths} salles de bain</div><div className="text-xs text-muted-foreground">Équipements premium</div></div></div>
          </div>

          {/* Mobile: Date picker */}
          <div className="lg:hidden py-6 border-b border-border">
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-2 border-b border-border">
                <div className="p-3 border-r border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Arrivée</div>
                  <div className="text-sm font-medium">{checkIn ? format(checkIn, 'dd MMM yyyy', { locale: fr }) : 'Sélectionner'}</div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Départ</div>
                  <div className="text-sm font-medium">{checkOut ? format(checkOut, 'dd MMM yyyy', { locale: fr }) : 'Sélectionner'}</div>
                </div>
              </div>
              <div className="p-3 border-b border-border flex justify-center">
                <CalendarPicker
                  mode="range"
                  selected={{ from: checkIn, to: checkOut }}
                  onSelect={(range) => {
                    setCheckIn(range?.from);
                    setCheckOut(range?.to);
                  }}
                  disabled={(date) => {
                    // Désactiver les dates passées
                    if (date < new Date()) return true;

                    // Désactiver les dates déjà réservées (exclure les annulées)
                    const isBooked = bookings.some((b) => {
                      // Exclure les réservations annulées
                      if (b.status === "CANCELLED") return false;
                      const checkIn = new Date(b.checkIn);
                      const checkOut = new Date(b.checkOut);
                      return isWithinInterval(date, { start: checkIn, end: new Date(checkOut.getTime() - 1) }) ||
                             isSameDay(date, checkIn) ||
                             isSameDay(date, new Date(checkOut.getTime() - 1));
                    });
                    return isBooked;
                  }}
                  numberOfMonths={1}
                />
              </div>
              <Popover open={mobileGuestPickerOpen} onOpenChange={setMobileGuestPickerOpen}>
                <PopoverTrigger asChild>
                  <button className="p-3 text-left hover:bg-secondary/50 transition-colors">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Voyageurs</div>
                    <div className="text-sm font-medium">{adults + children} voyageur{adults + children > 1 ? 's' : ''}</div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Adultes</div>
                        <div className="text-xs text-muted-foreground">13 ans ou plus</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setAdults(Math.max(1, adults - 1))} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">-</button>
                        <span className="w-6 text-center">{adults}</span>
                        <button onClick={() => setAdults(Math.min(p.guests, adults + 1))} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">+</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Enfants</div>
                        <div className="text-xs text-muted-foreground">2 à 12 ans</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setChildren(Math.max(0, children - 1))} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">-</button>
                        <span className="w-6 text-center">{children}</span>
                        <button onClick={() => setChildren(Math.min(p.guests - adults, children + 1))} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">+</button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Mobile: Own booking info */}
          {availability === false && isOwnBooking && (
            <div className="lg:hidden py-6 border-b border-border">
              <div className={`p-4 rounded-xl ${isOwnBooking ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                <p className={`text-sm font-medium mb-2 ${isOwnBooking ? 'text-primary' : 'text-destructive'}`}>
                  {isOwnBooking ? "Vous avez déjà réservé cette chambre pour ces dates" : "Cette chambre est déjà réservée pour ces dates"}
                </p>
                {conflictingBookings.length > 0 && (
                  <div>
                    <p className={`text-xs font-medium mb-1 ${isOwnBooking ? 'text-primary' : 'text-destructive'}`}>Dates réservées :</p>
                    {conflictingBookings.map((booking, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        {new Date(booking.checkIn).toLocaleDateString('fr-FR')} – {new Date(booking.checkOut).toLocaleDateString('fr-FR')}
                        {booking.status === 'PENDING' && ' (En attente)'}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => window.location.href = '/bookings'}
                  className="mt-3 w-full h-10 bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Voir ma réservation
                </button>
              </div>
            </div>
          )}
          {room.sizeSqm && (
            <div className="py-4 border-b border-border">
              <div className="text-sm text-muted-foreground">Surface : <span className="text-foreground font-medium">{room.sizeSqm} m²</span></div>
            </div>
          )}

          <div className="py-6 border-b border-border">
            <h2 className="font-display text-2xl mb-4">À propos de ce logement</h2>
            <p className="text-muted-foreground leading-relaxed text-pretty max-w-2xl">{p.description}</p>
          </div>

          <div className="py-6 border-b border-border">
            <h2 className="font-display text-2xl mb-4">Ce que ce lieu offre</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {p.amenities.map((a: string) => (
                <div key={a} className="flex items-center gap-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">{a}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="py-6 border-b border-border">
            <h2 className="font-display text-2xl mb-4">Politiques et conditions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium"><Clock className="h-4 w-4" /> Heure d&apos;arrivée</div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>• {room?.checkInStart || '15:00'} – {room?.checkInEnd || '22:00'}</div>
                  <div>• {room?.checkInMethod || 'Arrivée autonome avec clavier'}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium"><Clock className="h-4 w-4" /> Heure de départ</div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>• {room?.checkOutTime || '11:00'}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium"><Shield className="h-4 w-4" /> Politique d&apos;annulation</div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>• {room?.cancellationPolicy || 'Annulation gratuite avant 7 jours, 50% de remboursement avant 3 jours'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="py-6 border-b border-border">
            <h2 className="font-display text-2xl mb-4">Disponibilités</h2>
            <HotelBookingCalendar
              hotelName={room.name}
              availability={availabilityMap}
              basePrice={room.basePrice}
              currencyLabel={room.currency === "XOF" ? "FCFA" : room.currency}
              monthsToShow={2}
              maxGuestsPerRoom={room.maxGuests}
              initialCheckIn={checkIn ?? null}
              initialCheckOut={checkOut ?? null}
              onSelectionChange={handleSelectionChange}
              onGuestsChange={handleGuestsChange}
            />
          </div>

          <div className="py-6 border-b border-border">
            <h2 className="font-display text-2xl mb-4">Où vous serez</h2>
            <div className="aspect-[16/9] rounded-2xl bg-muted relative overflow-hidden border border-border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.7777777777778!2d-6.6443927!3d4.7239875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xf961312d9e1df9d:0x7ba51b79fb1fd8ea!2sH%C3%B4tel+Nahoui+Sp!5e0!3m2!1sfr!2sci!4v1620000000000!5m2!1sfr!2sci"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
              />
            </div>
            <div className="text-center mt-4">
              <a
                href="https://www.google.com/maps/place/H%C3%B4tel+Nahoui+Sp/@4.7239875,-6.6443927,17z/data=!4m9!3m8!1s0xf961312d9e1df9d:0x7ba51b79fb1fd8ea!5m2!4m1!1i2!8m2!3d4.7239875!4d-6.6418178!16s%2Fg%2F11c2pjqlkp?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <MapPin className="h-4 w-4" />
                Ouvrir dans Google Maps
              </a>
            </div>
          </div>

          {/* Reviews section - What guests say */}
          <div ref={reviewSectionRef} className="py-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl">Ce que disent les voyageurs ({reviewStats.approved})</h2>
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="text-sm border-b border-foreground pb-1 hover:border-primary hover:text-primary transition-colors"
              >
                {showReviewForm ? "Annuler" : "Écrire un avis"}
              </button>
            </div>

            {/* Review submission form */}
            {showReviewForm && (
              <div className="mb-6 p-6 rounded-2xl border border-border bg-secondary/20">
                {!user ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-3">Connectez-vous pour laisser un avis</p>
                    <button
                      onClick={() => {
                        setAuthPurpose("review");
                        setAuthModalOpen(true);
                      }}
                      className="px-6 py-2 bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                    >
                      Se connecter
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-medium mb-3">Laissez votre avis</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Note</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setReviewRating(star)}
                              className="h-8 w-8 flex items-center justify-center transition-colors"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  star <= reviewRating ? "fill-primary text-primary" : "text-muted-foreground"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Commentaire</label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Partagez votre expérience..."
                          className="w-full h-32 rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none"
                          maxLength={1000}
                        />
                        <p className="text-xs text-muted-foreground mt-1">{reviewComment.length}/1000</p>
                      </div>
                      <button
                        onClick={handleSubmitReview}
                        disabled={submittingReview || reviewRating === 0 || !reviewComment.trim()}
                        className="px-6 py-2 bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        {submittingReview ? "Envoi..." : "Envoyer l'avis"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="text-muted-foreground">Aucun avis pour le moment</p>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-border pb-6 last:border-b-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-3">
                        {review.user?.image ? (
                          <img src={review.user.image} alt={review.user.name || "User"} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center font-display text-sm">
                            {(review.user?.name || "U")[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm">{review.user?.name || "Anonyme"}</div>
                          <div className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        {review.rating}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky booking card */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-28">
            <div className="border border-border p-7 bg-card">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="font-display text-3xl">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: p.currency,
                      maximumFractionDigits: 0,
                    }).format(p.price)}
                  </span>
                  <span className="text-muted-foreground"> / nuit</span>
                </div>
                <div className="flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-current"/>{p.rating.toFixed(2)}</div>
              </div>

              <div className="mt-4 border border-border rounded-xl overflow-hidden">
                <div className="grid grid-cols-2">
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <button className="p-3 border-r border-b border-border text-left hover:bg-secondary/50 transition-colors">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Arrivée</div>
                        <div className="text-sm font-medium">{checkIn ? format(checkIn, 'dd MMM yyyy', { locale: fr }) : 'Ajouter date'}</div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker
                        mode="range"
                        selected={{ from: checkIn, to: checkOut }}
                        onSelect={(range) => {
                          setCheckIn(range?.from);
                          setCheckOut(range?.to);
                        }}
                        disabled={(date) => {
                          // Désactiver les dates passées
                          if (date < new Date()) return true;

                          // Désactiver les dates déjà réservées (exclure les annulées)
                          const isBooked = bookings.some((b) => {
                            // Exclure les réservations annulées
                            if (b.status === "CANCELLED") return false;
                            const checkIn = new Date(b.checkIn);
                            const checkOut = new Date(b.checkOut);
                            return isWithinInterval(date, { start: checkIn, end: new Date(checkOut.getTime() - 1) }) ||
                                   isSameDay(date, checkIn) ||
                                   isSameDay(date, new Date(checkOut.getTime() - 1));
                          });
                          return isBooked;
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <button className="p-3 border-b border-border text-left hover:bg-secondary/50 transition-colors">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Départ</div>
                        <div className="text-sm font-medium">{checkOut ? format(checkOut, 'dd MMM yyyy', { locale: fr }) : 'Ajouter date'}</div>
                      </button>
                    </PopoverTrigger>
                  </Popover>
                </div>
                <Popover open={guestPickerOpen} onOpenChange={setGuestPickerOpen}>
                  <PopoverTrigger asChild>
                    <button className="p-3 text-left hover:bg-secondary/50 transition-colors">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Voyageurs</div>
                      <div className="text-sm font-medium">{adults + children} voyageur{adults + children > 1 ? 's' : ''}</div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4" align="start">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Adultes</div>
                          <div className="text-xs text-muted-foreground">13 ans et plus</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setAdults(Math.max(1, adults - 1))} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:border-foreground">−</button>
                          <span className="w-6 text-center">{adults}</span>
                          <button onClick={() => setAdults(Math.min(p.guests, adults + 1))} disabled={adults + children >= p.guests} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:border-foreground disabled:opacity-30">+</button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Enfants</div>
                          <div className="text-xs text-muted-foreground">2–12 ans</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setChildren(Math.max(0, children - 1))} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:border-foreground">−</button>
                          <span className="w-6 text-center">{children}</span>
                          <button onClick={() => setChildren(Math.min(p.guests - adults, children + 1))} disabled={adults + children >= p.guests} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:border-foreground disabled:opacity-30">+</button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {checkingAvailability ? (
                <div className="mt-4 h-12 w-full bg-muted text-muted-foreground font-medium grid place-items-center">
                  Vérification...
                </div>
              ) : availability === false ? (
                isOwnBooking ? (
                  <button
                    onClick={() => window.location.href = '/bookings'}
                    className="mt-4 btn-fill-editorial w-full"
                  >
                    Voir ma réservation
                  </button>
                ) : (
                  <div className="mt-4 h-12 w-full bg-destructive text-destructive-foreground font-medium grid place-items-center">
                    Non disponible
                  </div>
                )
              ) : (
                <button
                  onClick={() => setBookingFlowOpen(true)}
                  className="mt-4 btn-fill-editorial w-full"
                >
                  Réserver
                </button>
              )}

              {availability === false && (
                <>
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    {isOwnBooking ? "Vous avez déjà réservé cette chambre pour ces dates" : "Cette chambre est déjà réservée pour ces dates"}
                  </p>
                  {conflictingBookings.length > 0 && (
                    <div className={`mt-2 p-3 rounded-lg ${isOwnBooking ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                      <p className={`text-xs font-medium mb-1 ${isOwnBooking ? 'text-primary' : 'text-destructive'}`}>Dates réservées :</p>
                      {conflictingBookings.map((booking, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground">
                          {new Date(booking.checkIn).toLocaleDateString('fr-FR')} – {new Date(booking.checkOut).toLocaleDateString('fr-FR')}
                          {booking.status === 'PENDING' && ' (En attente)'}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {availability === true && (
                <p className="text-center text-xs text-green-600 dark:text-green-400 mt-3 flex items-center justify-center gap-1">
                  <Check className="h-3 w-3" />
                  Disponible pour ces dates
                </p>
              )}
            </div>
          </div>
        </aside>
      </section>

      {/* Mobile sticky booking bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-4 py-2 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-sm">
              {new Intl.NumberFormat("fr-FR", { style: "currency", currency: p.currency, maximumFractionDigits: 0 }).format(p.price)}
            </span>
            <span className="text-[10px] text-muted-foreground">/nuit</span>
          </div>
          {nights > 0 && <div className="text-[10px] text-muted-foreground">{nights} nuit{nights > 1 ? 's' : ''} · {new Intl.NumberFormat("fr-FR", { style: "currency", currency: p.currency, maximumFractionDigits: 0 }).format(p.price * nights)}</div>}
        </div>
        {checkingAvailability ? (
          <div className="h-9 px-4 bg-muted text-muted-foreground text-xs font-medium grid place-items-center">Vérification…</div>
        ) : availability === false ? (
          isOwnBooking ? (
            <button
              onClick={() => window.location.href = '/bookings'}
              className="h-9 px-4 bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity shrink-0"
            >
              Voir ma réservation
            </button>
          ) : (
            <div className="h-9 px-4 bg-destructive text-destructive-foreground text-xs font-medium grid place-items-center">Non dispo.</div>
          )
        ) : (
          <button onClick={() => setBookingFlowOpen(true)} className="h-9 px-4 bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity shrink-0">
            Réserver
          </button>
        )}
      </div>

      <Footer />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} purpose={authPurpose} />

      {/* Booking Flow Overlay */}
      <AnimatePresence>
        {bookingFlowOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background overflow-hidden"
          >
            <BookingFlowOverlay
              room={room}
              initialCheckIn={checkIn}
              initialCheckOut={checkOut}
              initialAdults={adults}
              initialChildren={children}
              bookings={bookings}
              onClose={() => setBookingFlowOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BookingFlowOverlay({ room, initialCheckIn, initialCheckOut, initialAdults, initialChildren, bookings, onClose }: { room: Room | null; initialCheckIn: Date | undefined; initialCheckOut: Date | undefined; initialAdults: number; initialChildren: number; bookings: { id: string; checkIn: string; checkOut: string; status: string }[]; onClose: () => void }) {
  const { user, refresh } = useAuth();
  const steps = ["Dates", "Détails", "Récapitulatif"] as const;
  type Step = typeof steps[number];
  const [step, setStep] = useState<Step>(() => {
    const storedState = localStorage.getItem('bookingFlowState');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        const restoredStep = state.step === 'Auth' ? 'Détails' : state.step;
        localStorage.removeItem('bookingFlowState');
        return (steps as readonly string[]).includes(restoredStep) ? restoredStep : 'Dates';
      } catch {
        return 'Dates';
      }
    }
    return 'Dates';
  });
  const stepIndex = steps.indexOf(step);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processingPayment, setProcessingPayment] = useState(false);
  const hasSyncedUserInfo = useRef(false);

  // Local state for editable fields
  const [checkIn, setCheckIn] = useState<Date | undefined>(() => {
    const storedState = localStorage.getItem('bookingFlowState');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        return state.checkIn ? new Date(state.checkIn) : initialCheckIn;
      } catch {
        return initialCheckIn;
      }
    }
    return initialCheckIn;
  });
  const [checkOut, setCheckOut] = useState<Date | undefined>(() => {
    const storedState = localStorage.getItem('bookingFlowState');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        return state.checkOut ? new Date(state.checkOut) : initialCheckOut;
      } catch {
        return initialCheckOut;
      }
    }
    return initialCheckOut;
  });
  const maxGuests = room?.maxGuests ?? 10;
  const [adults, setAdults] = useState(() => {
    const clamp = (v: number) => Math.min(v || 1, maxGuests);
    const storedState = localStorage.getItem('bookingFlowState');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        return clamp(state.adults || initialAdults || 1);
      } catch {
        return clamp(initialAdults || 1);
      }
    }
    return clamp(initialAdults || 1);
  });
  const [children, setChildren] = useState(() => {
    const clamp = (v: number) => Math.min(v || 0, Math.max(0, maxGuests - adults));
    const storedState = localStorage.getItem('bookingFlowState');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        return clamp(state.children || initialChildren || 0);
      } catch {
        return clamp(initialChildren || 0);
      }
    }
    return clamp(initialChildren || 0);
  });
  const [guestInfo, setGuestInfo] = useState(() => {
    const storedState = localStorage.getItem('bookingFlowState');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        return state.guestInfo || { firstName: '', lastName: '', email: '', phone: '' };
      } catch {
        return { firstName: '', lastName: '', email: '', phone: '' };
      }
    }
    return { firstName: '', lastName: '', email: '', phone: '' };
  });

  // Store booking flow state in window for OAuth redirect
  useEffect(() => {
    (window as unknown as { __bookingFlowState?: unknown }).__bookingFlowState = {
      step,
      checkIn,
      checkOut,
      adults,
      children,
      guestInfo,
    };
  }, [step, checkIn, checkOut, adults, children, guestInfo]);

  // Refresh user state after auth modal closes
  useEffect(() => {
    if (!authModalOpen) {
      refresh();
    }
  }, [authModalOpen, refresh]);

  // Block body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Sync guest info when user changes, but only if guestInfo is empty and not already synced
  useEffect(() => {
    if (user && !hasSyncedUserInfo.current && !guestInfo.firstName && !guestInfo.lastName && !guestInfo.email) {
      setGuestInfo({
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      hasSyncedUserInfo.current = true;
    }
  }, [user, guestInfo.firstName, guestInfo.lastName, guestInfo.email]);

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 3;
  const total = room?.basePrice ? room.basePrice * nights : 0;

  const overlayAvailabilityMap = useMemo(() => buildAvailabilityMap(bookings), [bookings]);

  // Real-time availability check whenever the selected dates change
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [conflictingBookings, setConflictingBookings] = useState<{ id: string; checkIn: string; checkOut: string; status: string }[]>([]);
  const [isOwnBooking, setIsOwnBooking] = useState(false);

  useEffect(() => {
    if (!room?.slug || !checkIn || !checkOut || checkOut <= checkIn) {
      setAvailability(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setCheckingAvailability(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/rooms/${room.slug}/availability?checkIn=${checkIn.toISOString()}&checkOut=${checkOut.toISOString()}&userId=${user?.id || ''}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.success) {
          setAvailability(data.data.available);
          setConflictingBookings(data.data.conflictingBookings || []);
          setIsOwnBooking(data.data.isOwnBooking || false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Erreur vérification disponibilité", err);
          setAvailability(null);
        }
      } finally {
        if (!cancelled) setCheckingAvailability(false);
      }
    })();
    return () => { cancelled = true; };
  }, [room?.slug, checkIn, checkOut, user?.id]);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 'Dates') {
      if (!checkIn) newErrors.checkIn = 'Date d\'arrivée requise';
      if (!checkOut) newErrors.checkOut = 'Date de départ requise';
      if (checkIn && checkOut && checkOut <= checkIn) newErrors.dates = 'Le départ doit être après l\'arrivée';
      if (checkIn && checkOut && checkOut > checkIn && availability === false) newErrors.dates = isOwnBooking ? 'Vous avez déjà une réservation pour ces dates' : 'Cette chambre n\'est plus disponible pour ces dates';
    }
    if (step === 'Détails') {
      // Only validate details if user is authenticated
      if (user) {
        if (!guestInfo.firstName.trim()) newErrors.firstName = 'Prénom requis';
        if (!guestInfo.lastName.trim()) newErrors.lastName = 'Nom requis';
        const hasEmail = guestInfo.email.trim();
        const hasPhone = guestInfo.phone.trim();
        if (!hasEmail && !hasPhone) {
          newErrors.contact = 'Email ou téléphone requis';
        }
        if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) {
          newErrors.email = 'Adresse email invalide';
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => {
    if (validateStep()) {
      const idx = steps.indexOf(step);
      if (idx < steps.length - 1) setStep(steps[idx + 1]);
    }
  };

  const prev = () => {
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
    else onClose();
  };

  const canContinue =
    (step === 'Dates' && checkIn && checkOut && checkOut > checkIn && !checkingAvailability && availability !== false) ||
    (step === 'Détails' && user && guestInfo.firstName && guestInfo.lastName && (guestInfo.email || guestInfo.phone)) ||
    step === 'Récapitulatif';

  const inputCls = "h-12 w-full rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-foreground transition-all";

  const handlePayNow = async () => {
    // Vérifier la session avant de payer
    try {
      const authCheck = await api.get<{ user: { id?: string; name?: string; email?: string } }>("/api/auth/me");
      if (!authCheck.user) {
        setAuthModalOpen(true);
        toast.error('Vous devez être connecté pour effectuer une réservation.');
        return;
      }
      refresh();
    } catch {
      setAuthModalOpen(true);
      toast.error('Vous devez être connecté pour effectuer une réservation.');
      return;
    }

    if (!room || !checkIn || !checkOut) {
      toast.error('Veuillez sélectionner des dates valides avant de payer.');
      return;
    }

    setProcessingPayment(true);

    try {
      const availabilityResponse = await fetch(`/api/rooms/${room.slug}/availability?checkIn=${encodeURIComponent(checkIn.toISOString())}&checkOut=${encodeURIComponent(checkOut.toISOString())}&userId=${user?.id || ''}`);
      const availabilityResult = await availabilityResponse.json();

      if (!availabilityResponse.ok || !availabilityResult.success || !availabilityResult.data?.available) {
        // Si c'est la propre réservation de l'utilisateur, rediriger vers ses réservations
        if (availabilityResult.data?.isOwnBooking) {
          toast.info("Vous avez déjà une réservation pour ces dates. Redirection vers vos réservations...");
          setTimeout(() => {
            window.location.href = '/bookings';
          }, 1500);
          setProcessingPayment(false);
          return;
        }
        toast.error(availabilityResult.message || "Cette chambre n'est plus disponible pour ces dates.");
        setProcessingPayment(false);
        return;
      }

      // Vérifier que la chambre est toujours publiée
      if (!room.isPublished) {
        toast.error("Cette chambre n'est plus disponible à la réservation.");
        setProcessingPayment(false);
        return;
      }

      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          adults,
          children,
          guestFirstName: guestInfo.firstName,
          guestLastName: guestInfo.lastName,
          guestEmail: guestInfo.email,
          guestPhone: guestInfo.phone,
        }),
      });
      console.log('[Booking] Request sent:', {
        roomId: room.id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        adults,
        children,
        guestFirstName: guestInfo.firstName,
        guestLastName: guestInfo.lastName,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
      });

      const bookingResult = await bookingResponse.json();

      if (bookingResult.success && bookingResult.data?.booking) {
        toast.success('Réservation confirmée avec succès !');
        setConfirmed(true);
        setProcessingPayment(false);
        setTimeout(() => {
          window.location.href = '/bookings';
        }, 2000);
      } else {
        toast.error('Erreur lors de la création de la réservation: ' + (bookingResult.message || 'Erreur inconnue'));
        setProcessingPayment(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Erreur lors de la vérification de disponibilité ou de la création du paiement');
      setProcessingPayment(false);
    }
  };

  return (
    <div className="h-screen bg-background overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 lg:px-10 pt-10 pb-24">
        <button onClick={onClose} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" /> Quitter
        </button>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl mt-6">Confirmer et payer</h1>

        {/* Stepper */}
        <div className="mt-6 flex items-center gap-3 sm:gap-6 flex-wrap">
          {steps.map((s, i) => {
            const active = i === stepIndex;
            const done = i < stepIndex;
            return (
              <div key={s} className="flex items-center gap-2 sm:gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center text-xs font-medium border transition-all shrink-0 ${
                  done ? "bg-primary text-primary-foreground border-primary"
                  : active ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border"
                }`}>
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-sm hidden sm:inline ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
                {active && <span className="text-sm sm:hidden font-medium text-foreground">{s}</span>}
                {i < steps.length - 1 && <span className="hidden sm:inline-block h-px w-8 bg-border" />}
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Step content */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === "Dates" && (
                  <div className="border border-border rounded-3xl p-7 bg-card">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><Calendar className="h-4 w-4" />Votre voyage</div>
                    <div className="mt-4 space-y-4">
                      <HotelBookingCalendar
                        availability={overlayAvailabilityMap}
                        basePrice={room?.basePrice ?? 0}
                        currencyLabel={room?.currency === "XOF" ? "FCFA" : room?.currency ?? "FCFA"}
                        monthsToShow={1}
                        maxGuestsPerRoom={room?.maxGuests ?? 4}
                        initialCheckIn={checkIn ?? null}
                        initialCheckOut={checkOut ?? null}
                        onSelectionChange={(ci, co) => {
                          setCheckIn(ci ?? undefined);
                          setCheckOut(co ?? undefined);
                        }}
                        onGuestsChange={(guests) => {
                          const maxGuests = room?.maxGuests ?? guests.adults + guests.children;
                          const nextAdults = Math.min(guests.adults, maxGuests);
                          setAdults(nextAdults);
                          setChildren(Math.min(guests.children, maxGuests - nextAdults));
                        }}
                      />
                      {errors.dates && <p className="mt-2 text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.dates}</p>}

                      {checkIn && checkOut && checkOut > checkIn && (
                        checkingAvailability ? (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
                            Vérification de la disponibilité…
                          </p>
                        ) : availability === false ? (
                          <div className="p-3 rounded-lg bg-destructive/10">
                            <p className="text-sm font-medium text-destructive flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {isOwnBooking ? "Vous avez déjà une réservation pour ces dates" : "Chambre indisponible pour ces dates"}
                            </p>
                            {conflictingBookings.length > 0 && (
                              <div className="mt-1">
                                {conflictingBookings.map((booking, idx) => (
                                  <div key={idx} className="text-xs text-muted-foreground">
                                    {new Date(booking.checkIn).toLocaleDateString('fr-FR')} – {new Date(booking.checkOut).toLocaleDateString('fr-FR')}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : availability === true ? (
                          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                            <Check className="h-4 w-4" />
                            Chambre disponible pour ces dates
                          </p>
                        ) : null
                      )}

                      <p className="mt-4 text-sm text-muted-foreground">{nights} nuit{nights > 1 ? "s" : ""} · {room?.location.city ? `${room.location.city}, ${room.location.name}` : room?.location.name}</p>
                    </div>
                  </div>
                )}

                {step === "Détails" && (
                  <div className="border border-border rounded-3xl p-7 bg-card">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {user ? <Users className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      {user ? "Vos coordonnées" : "Authentification"}
                    </div>
                    <div className="mt-5">
                      {user ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="block">
                              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Prénom</span>
                              <div className="mt-1.5">
                                <input value={guestInfo.firstName} onChange={(e) => setGuestInfo({...guestInfo, firstName: e.target.value})} placeholder="Jean" className={inputCls} />
                                {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>}
                              </div>
                            </label>
                            <label className="block">
                              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nom</span>
                              <div className="mt-1.5">
                                <input value={guestInfo.lastName} onChange={(e) => setGuestInfo({...guestInfo, lastName: e.target.value})} placeholder="Adje" className={inputCls} />
                                {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>}
                              </div>
                            </label>
                          </div>
                          <label className="block">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</span>
                            <div className="mt-1.5">
                              <input value={guestInfo.email} onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})} placeholder="email@example.com" type="email" className={inputCls} />
                              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                            </div>
                          </label>
                          <label className="block">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Téléphone</span>
                            <div className="mt-1.5">
                              <div className="flex">
                                <span className="inline-flex items-center gap-2 px-3 h-12 border border-r-0 border-border bg-muted text-muted-foreground text-sm rounded-l-xl">
                                  <img src="https://www.countryflags.com/wp-content/uploads/cote-d-ivoire-flag-png-large.png" alt="CI" className="h-5 w-auto" />
                                  225
                                </span>
                                <input
                                  value={guestInfo.phone}
                                  onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
                                  placeholder="07 00 00 00 00"
                                  type="tel"
                                  className={inputCls + " rounded-l-none"}
                                />
                              </div>
                              {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                            </div>
                          </label>
                          {errors.contact && <p className="mt-2 text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.contact}</p>}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-secondary/50 text-center">
                          <p className="text-sm text-muted-foreground mb-3">Veuillez vous connecter pour continuer</p>
                          <Button onClick={() => setAuthModalOpen(true)} className="w-full">Se connecter</Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {step === "Récapitulatif" && (
                  <div className="border border-border rounded-3xl p-7 bg-card">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><Shield className="h-4 w-4" />Récapitulatif</div>
                    <div className="mt-5 space-y-3">
                      <div className="flex justify-between py-3 border-b border-border text-sm">
                        <span className="text-muted-foreground">Chambre</span>
                        <span className="font-medium">{room?.name}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-border text-sm">
                        <span className="text-muted-foreground">Dates</span>
                        <span className="font-medium">{checkIn && checkOut ? `${format(checkIn, 'dd MMM yyyy')} – ${format(checkOut, 'dd MMM yyyy')} (${nights} nuit${nights > 1 ? 's' : ''})` : '-'}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-border text-sm">
                        <span className="text-muted-foreground">Voyageurs</span>
                        <span className="font-medium">{adults} adulte{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} enfant${children > 1 ? 's' : ''}` : ''}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-border text-sm">
                        <span className="text-muted-foreground">Contact</span>
                        <span className="font-medium">{guestInfo.firstName} {guestInfo.lastName}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-border text-sm">
                        <span className="text-muted-foreground">Email</span>
                        <span className="font-medium">{guestInfo.email}</span>
                      </div>
                      <div className="flex justify-between py-3 text-sm">
                        <span className="text-muted-foreground">Téléphone</span>
                        <span className="font-medium">{guestInfo.phone ? `+225 ${guestInfo.phone}` : ''}</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>


            {!confirmed && (
              <div className="mt-8 flex items-center justify-between gap-4">
                <button onClick={prev} className="text-sm text-muted-foreground hover:text-foreground shrink-0">{step === "Dates" ? "Retour au détail" : "Étape précédente"}</button>
                {step === "Récapitulatif" ? (
                  <button
                    onClick={handlePayNow}
                    disabled={processingPayment}
                    className="h-12 px-6 sm:px-8 bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center leading-tight"
                  >
                    {processingPayment ? 'Traitement...' : (
                      <><span>Confirmer la réservation</span><span className="text-xs opacity-80">{new Intl.NumberFormat('fr-FR').format(total)} {room?.currency}</span></>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => next()}
                    disabled={!canContinue}
                    className="h-12 px-8 bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continuer
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          <aside className="lg:col-span-2 order-1 lg:order-2">
            <div className="lg:sticky lg:top-28 border border-border rounded-3xl p-4 sm:p-6 bg-card shadow-[var(--shadow-card)]">
              <div className="flex gap-3 sm:gap-4">
                <img src={room?.coverImageUrl || '/placeholder.jpg'} alt={room?.name} className="h-16 w-16 sm:h-24 sm:w-24 rounded-xl object-cover shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{room?.roomType.name}</div>
                  <div className="font-display text-base sm:text-lg truncate">{room?.name}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground truncate">{room?.location.city ? `${room.location.city}, ${room.location.name}` : room?.location.name}</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{new Intl.NumberFormat('fr-FR').format(room?.basePrice || 0)} {room?.currency} × {nights} nuits</span><span>{new Intl.NumberFormat('fr-FR').format(total)} {room?.currency}</span></div>
                <div className="pt-3 border-t border-border flex justify-between font-display text-lg">
                  <span>Total ({room?.currency})</span><span>{new Intl.NumberFormat('fr-FR').format(total)}</span>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-secondary/50 text-xs text-muted-foreground">
                Annulation gratuite avant {checkIn ? format(addDays(checkIn, -7), 'dd MMM yyyy') : '-'}.
              </div>

              {step === "Récapitulatif" && !confirmed && (
                <button
                  onClick={handlePayNow}
                  disabled={processingPayment}
                  className="mt-3 w-full h-12 bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center leading-tight"
                >
                  {processingPayment ? 'Traitement en cours...' : (
                    <><span>Confirmer la réservation</span><span className="text-xs opacity-80">{new Intl.NumberFormat('fr-FR').format(total)} {room?.currency}</span></>
                  )}
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} purpose="booking" />
    </div>
  );
}
export function StayDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Nav />
        <section className="mx-auto max-w-7xl px-6 lg:px-10 pt-10">
          <Skeleton className="h-12 w-96 mb-6" />
          <Skeleton className="h-[60vh] min-h-[420px] w-full rounded-3xl" />
        </section>
      </div>
    }>
      <StayDetailPageContent />
    </Suspense>
  );
}
