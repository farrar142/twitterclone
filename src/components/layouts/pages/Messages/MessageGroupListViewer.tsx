import API from '#/api';
import { MessageGroup } from '#/api/chats';
import { User } from '#/api/users/types';
import TextInput from '#/components/inputs/TextInput';
import NextLink from '#/components/NextLink';
import { useCursorPagination } from '#/hooks/paginations/useCursorPagination';
import { useKeyScrollPosition } from '#/hooks/useKeepScrollPosition';
import { useUserProfile } from '#/hooks/useUser';
import useValue from '#/hooks/useValue';
import paths from '#/paths';
import { glassmorphism } from '#/styles';
import { formatDateBasedOnYear } from '#/utils/formats/formatDateBasedOnYear';
import { Search } from '@mui/icons-material';
import { Avatar, Box, InputAdornment, Stack, Typography } from '@mui/material';
import React, { useMemo } from 'react';

const DirectMessageSimpleViewer: React.FC<{
  group: MessageGroup;
  me: User;
}> = ({ group, me }) => {
  const otherUser = useMemo(
    () => group.attendants.filter((user) => user.id !== me.id)[0],
    [group]
  );
  const lastMessageDate = useMemo(
    () =>
      group.latest_message &&
      formatDateBasedOnYear(group.latest_message_created_at),
    [group.latest_message]
  );
  return (
    <NextLink href={paths.groupMessage(group.id)}>
      <Stack
        direction='row'
        spacing={1}
        p={1}
        alignItems='center'
        sx={(theme) => ({
          ':hover': {
            bgcolor: theme.palette.action.hover,
          },
        })}
      >
        <Avatar
          src={otherUser.profile_image?.small || otherUser.profile_image?.url}
        />
        <Stack>
          <Stack direction='row' spacing={1} alignItems='center'>
            <Typography fontWeight='bold' variant='h6' color='textPrimary'>
              {otherUser.nickname}
            </Typography>
            {lastMessageDate && (
              <>
                <Typography color='textPrimary'>·</Typography>
                <Typography
                  component='span'
                  variant='subtitle2'
                  color='textDisabled'
                >
                  {lastMessageDate}
                </Typography>
              </>
            )}
          </Stack>
          <Typography color='textDisabled'>
            <Typography component='span'>{group.latest_message}</Typography>
          </Typography>
        </Stack>
      </Stack>
    </NextLink>
  );
};

const MessageGroupItem: React.FC<{ group: MessageGroup; me: User }> = ({
  group,
  me,
}) => {
  // if (!group.latest_message) return <></>;
  if (group.is_direct_message)
    return <DirectMessageSimpleViewer group={group} me={me} />;
  return <></>;
};

export const MessageGroupListViewer: React.FC<{ me: User }> = ({ me }) => {
  const [profile] = useUserProfile(me);
  const search = useValue('');
  const pagination = useCursorPagination({
    getter: API.Messages.message.getItems,
    apiKey: `${profile.username}:message_groups`,
  });
  const [_, setScroll] = useKeyScrollPosition();
  return (
    <Box maxWidth='100%'>
      <Box
        position='sticky'
        top={0}
        p={1}
        sx={(theme) => ({
          ...glassmorphism(theme),
          zIndex: 10,
          cursor: 'pointer',
          ':hover': { bgcolor: theme.palette.action.hover },
        })}
        onClick={() => setScroll({ key: 'page:messages', value: 0 })}
      >
        <Typography variant='h5'>Messages</Typography>
      </Box>
      <Box p={1}>
        <TextInput
          fullWidth
          label='Search Messages'
          name='message-search'
          value={search.get}
          onChange={search.onTextChange}
          size='small'
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position='start'>
                  <Search />
                </InputAdornment>
              ),
              sx: { borderRadius: 5 },
            },
          }}
        />
      </Box>
      <Stack spacing={2}>
        {pagination.data.map((group) => {
          return <MessageGroupItem key={group.id} group={group} me={profile} />;
        })}
      </Stack>
    </Box>
  );
};
