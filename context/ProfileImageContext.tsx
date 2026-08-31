import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_IMAGE_KEY = '@profile_image';

type ProfileImageContextType = {
  profileImage: string | null;
  setProfileImage: (uri: string | null) => Promise<void>;
};

const ProfileImageContext = createContext<ProfileImageContextType>({
  profileImage: null,
  setProfileImage: async () => {},
});

export function ProfileImageProvider({ children }: { children: ReactNode }) {
  const [profileImage, setProfileImageState] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(PROFILE_IMAGE_KEY).then((uri) => {
      if (uri) setProfileImageState(uri);
    });
  }, []);

  const setProfileImage = async (uri: string | null) => {
    setProfileImageState(uri);
    if (uri) {
      await AsyncStorage.setItem(PROFILE_IMAGE_KEY, uri);
    } else {
      await AsyncStorage.removeItem(PROFILE_IMAGE_KEY);
    }
  };

  return (
    <ProfileImageContext.Provider value={{ profileImage, setProfileImage }}>
      {children}
    </ProfileImageContext.Provider>
  );
}

export const useProfileImage = () => useContext(ProfileImageContext);
