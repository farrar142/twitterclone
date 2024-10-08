import { RegisteredUser } from '#/api/users/types';
import { useRouter } from '#/hooks/useCRouter';
import { useUserProfile } from '#/hooks/useUser';
import { glassmorphism } from '#/styles';
import { ArrowBack } from '@mui/icons-material';
import {
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

export const ProfileHeader: React.FC<{
  profile: RegisteredUser;
  postCount: number;
}> = ({ profile: _profile, postCount }) => {
  const [profile] = useUserProfile(_profile);
  const router = useRouter();
  const theme = useTheme();
  return (
    <Box position='sticky' top={0} sx={{ ...glassmorphism(theme), zIndex: 10 }}>
      <Stack spacing={1} direction='row' p={1} alignItems='center'>
        <Tooltip title='Back to History' onClick={() => router.back}>
          <Box>
            <IconButton onClick={router.back}>
              <ArrowBack />
            </IconButton>
          </Box>
        </Tooltip>
        <Stack>
          <Typography variant='h6'>{profile.nickname}</Typography>
          <Typography variant='caption' color='textDisabled'>
            {Intl.NumberFormat('ko-KR').format(postCount)} Posts
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
};
export default ProfileHeader;
