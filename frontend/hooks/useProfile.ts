// hooks/useProfile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile';
import { UpdateProfilePayload } from '@/types/profile';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { updateUser } from '@/store/authSlice';

export const PROFILE_KEYS = {
  profile: ['profile'] as const,
};

export const useProfile = () => {
  return useQuery({
    queryKey: PROFILE_KEYS.profile,
    queryFn: async () => {
      const res = await profileService.getProfile();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => profileService.updateProfile(data),
    onSuccess: (response) => {
      queryClient.setQueryData(PROFILE_KEYS.profile, response.data);
      if (currentUser) dispatch(updateUser({ ...currentUser, fullName: response.data.user.fullName }));
    },
  });
};
