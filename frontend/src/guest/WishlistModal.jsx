import React from 'react';
import { Heart, Trash2, ArrowRight, MapPin } from 'lucide-react';
import CustomModal from '../shared/CustomModal';

export default function WishlistModal({ wishlist = [], onRemove, onSelectRoom, onClose }) {
  return (
    <CustomModal
      isOpen={true}
      onClose={onClose}
      title="Your Saved Suites"
      subtitle="CG Chillcation Wishlist"
      icon={Heart}
      badge={
        <span className="text-xs font-mono text-zinc-300 px-3 py-1 rounded-full bg-white/10 border border-white/10">
          {wishlist.length} {wishlist.length === 1 ? 'room' : 'rooms'}
        </span>
      }
      size="2xl"
      footer={
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all uppercase tracking-wider"
        >
          Close
        </button>
      }
    >
      <div className="space-y-3">
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
    </CustomModal>
  );
}
