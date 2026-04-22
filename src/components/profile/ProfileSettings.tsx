import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { User, Camera, Save, ShieldCheck } from 'lucide-react';
import { UserProfile } from '@/src/types';

interface ProfileSettingsProps {
  profile: UserProfile | null;
  updating: boolean;
  onUpdate: (data: { full_name: string; avatar_url: string }) => void;
  onAvatarUpload: (file: File) => Promise<string | null>;
}

export const ProfileSettings = ({ profile, updating, onUpdate, onAvatarUpload }: ProfileSettingsProps) => {
  const [fullName, setFullName] = React.useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = React.useState(profile?.avatar_url || '');
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if profile changes
  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 handleSubmit triggered in ProfileSettings');
    onUpdate({ full_name: fullName, avatar_url: avatarUrl });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📂 File selected for avatar upload:', { name: file.name, size: file.size, type: file.type });
    setUploading(true);
    try {
      const url = await onAvatarUpload(file);
      console.log('🔗 Upload result URL:', url);
      if (url) {
        setAvatarUrl(url);
      } else {
        console.warn('⚠️ No URL returned from upload');
      }
    } catch (err) {
      console.error('❌ ProfileSettings handleFileChange error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      key="profile"
      className="max-w-4xl"
    >
      <header className="mb-12">
        <h2 className="text-3xl font-black text-gray-900 mb-2">Hồ Sơ Cá Nhân</h2>
        <p className="text-gray-500 font-medium italic">Chỉnh sửa thông tin và cá nhân hóa tài khoản của bạn.</p>
      </header>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3">
          <div className="p-12 bg-gray-50/50 border-r border-gray-100 flex flex-col items-center justify-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden bg-white shadow-xl ring-4 ring-white relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-orange-50 flex items-center justify-center text-orange-500">
                    <User size={48} />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-3 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-orange-600 transition-all active:scale-90"
              >
                <Camera size={18} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <p className="mt-6 text-[11px] font-black uppercase tracking-widest text-gray-400">Ảnh đại diện</p>
          </div>

          <div className="col-span-2 p-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Địa chỉ Email</label>
                  <div className="px-6 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-500 font-bold text-sm">
                    {profile?.email}
                  </div>
                  <p className="mt-2 text-[10px] text-gray-400 italic">Email không thể thay đổi sau khi đăng ký.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Họ và Tên</label>
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập tên của bạn..."
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl transition-all focus:border-orange-500/20 focus:bg-white outline-none font-bold text-gray-900"
                  />
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-600 mb-8">
                <ShieldCheck size={18} className="shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-tight">
                  Thông tin của bạn được bảo mật và chỉ dùng để hiển thị trong hệ thống.
                </p>
              </div>

              <button 
                type="submit" 
                disabled={updating || uploading}
                className="w-full sm:w-auto px-12 py-5 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-100 hover:bg-orange-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {updating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} /> Lưu Thay Đổi
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
