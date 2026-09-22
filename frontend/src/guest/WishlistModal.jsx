import React from 'react';
import { X, Heart, MapPin, ArrowRight } from 'lucide-react';

export default function WishlistModal({ wishlistRooms, onClose, onSelectRoom, onRemoveFromWishlist }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl liquid-glass border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 animate-modal-pop">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2.5 rounded-full liquid-btn text-white hover:bg-white hover:text-black transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 flex items-center space-x-3">
          <div className="p-3.5 rounded-2xl bg-white text-black shadow-lg">
            <Heart className="w-6 h-6 fill-black" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">Your Saved Wishlist</h3>
            <p className="text-xs text-brand-lightgray">
              Saved locally in browser ({wishlistRooms.length} suite{wishlistRooms.length === 1 ? '' : 's'})
            </p>
          </div>
        </div>

        {/* Empty State */}
        {wishlistRooms.length === 0 ? (
          <div className="text-center py-12 liquid-glass-card rounded-2xl p-8">
            <Heart className="w-12 h-12 mx-auto text-brand-gray mb-3" />
            <p className="text-white font-bold text-base">Your wishlist is empty</p>
            <p className="text-xs text-brand-lightgray mt-1 max-w-sm mx-auto">
              Explore available suites in Antipolo and Cainta and click the heart icon to save your favorites.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
            {wishlistRooms.map((room) => {
              const image = room.images && room.images.length > 0 ? room.images[0] : 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80';
              return (
                <div key={room.id} className="liquid-glass-card rounded-2xl overflow-hidden flex flex-col justify-between">
                  <div className="relative h-40">
                    <img src={image} alt={room.room_name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => onRemoveFromWishlist(room.id)}
                      className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold px-3 py-1 rounded-full border border-white/20 flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{room.location}</span>
                    </span>
                  </div>

                  <div className="p-4">
                    <h4 className="text-lg font-bold text-white">{room.room_name}</h4>
                    <span className="text-xs text-brand-lightgray font-bold block mt-1">
                      ₱{room.price_per_night.toLocaleString()} / night
                    </span>

                    <button
                      onClick={() => {
                        onClose();
                        onSelectRoom(room);
                      }}
                      className="w-full mt-3 liquid-btn-primary py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5"
                    >
                      <span>Book Suite</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
