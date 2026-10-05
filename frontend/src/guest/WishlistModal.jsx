import React from 'react';
import { X, Heart, Trash2, ArrowRight, MapPin } from 'lucide-react';

export default function WishlistModal({ wishlist = [], onRemove, onSelectRoom, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl liquid-glass border border-white/20 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 animate-modal-pop max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Your Saved Suites</h2>
              <p className="text-xs text-zinc-400 font-mono">
                {wishlist.length} {wishlist.length === 1 ? 'room saved' : 'rooms saved'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 no-scrollbar">
          {wishlist.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-300 font-bold">Your wishlist is empty</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Explore our minimalist luxury suites and click the heart icon to save your favorites.
              </p>
            </div>
          ) : (
            wishlist.map((room) => {
              const img = room.images && room.images.length > 0 ? room.images[0] : '';
              return (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 transition-all space-x-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={img}
                      alt={room.room_name}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-black text-white truncate">{room.room_name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 flex items-center space-x-1">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{room.location}</span>
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
                        ₱{Number(room.price_per_night).toLocaleString()} / night
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        onClose();
                        onSelectRoom(room);
                      }}
                      className="liquid-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemove(room.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10 transition-colors"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
