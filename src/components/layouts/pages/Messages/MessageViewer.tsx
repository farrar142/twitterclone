import { Message, MessageGroup } from '#/api/chats';
import { User } from '#/api/users/types';
import React, { FormEventHandler, useEffect, useMemo, useRef } from 'react';
import moment from 'moment';
import API from '#/api';
import { v4 as uuid } from 'uuid';
import TextInput from '#/components/inputs/TextInput';
import { useCursorPagination } from '#/hooks/paginations/useCursorPagination';
import { useDebouncedFunction } from '#/hooks/useDebouncedEffect';
import useMediaSize from '#/hooks/useMediaSize';
import { useObserver } from '#/hooks/useObserver';
import { useUserProfile } from '#/hooks/useUser';
import useValue from '#/hooks/useValue';
import { filterDuplicate } from '#/utils/arrays';
import { WS } from '#/utils/websockets';
import {
  Stack,
  Box,
  CircularProgress,
  Button,
  Divider,
  useTheme,
} from '@mui/material';
import { MessgeItem } from './MessageItem';
import { MergedMessage } from './types';
import {
  useMessageGroupItem,
  useUnreadedMessagesCount,
} from './MessageGroupAtom';

const getYearToMinuteString = (isostring: string) =>
  moment(isostring).format('YYYY-MM-DD-hh-mm');
const createDefaultMergedMessage = (message: Message) => ({
  user: message.user,
  messages: [message],
  identifier: message.identifier,
  minuteString: getYearToMinuteString(message.created_at),
});

export const MessageViewer: React.FC<{ group: MessageGroup; user: User }> = ({
  group: _group,
  user: profile,
}) => {
  const [user] = useUserProfile(profile);
  const { group } = useMessageGroupItem(_group, user);

  const fetchBlock = useRef<HTMLElement>();
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const observer = useObserver({ rootMargin: '0px', threshold: 1 });
  const message = useValue('');
  const { data, isFirstFetchSuccess, fetchNext, hasNextPage } =
    useCursorPagination({
      getter: API.Messages.message.getMessages(group.id),
      apiKey: `${user.username}:messages:${group.id}`,
      params: { page_size: 20 },
    });

  const typedMessage = useValue<Message[]>([]);
  const isNewMessage = useValue(false);

  const isScrollDown = () => {
    if (!chatBoxRef.current) return false;
    const c = chatBoxRef.current;
    if (c.clientHeight * 2 <= c.scrollHeight - c.scrollTop) return false;
    return true;
  };

  const scrollToDown = () => {
    if (!chatBoxRef.current) return;
    chatBoxRef.current.scroll({
      behavior: 'smooth',
      top: chatBoxRef.current.scrollHeight,
    });
  };

  const onMessageSend: FormEventHandler = (e) => {
    e.preventDefault();
    if (!message.get) return;
    const identifier = uuid();
    API.Messages.message.sendMessage(group.id, message.get, identifier);
    typedMessage.set((p) => [
      ...p,
      {
        id: -1,
        identifier,
        group: group.id,
        created_at: moment().toISOString(),
        message: message.get,
        user: user.id,
        nickname: profile.nickname,
        has_checked: true,
      },
    ]);
    message.set('');
  };

  const debounced = useDebouncedFunction();
  //이전 메세지 가져오기
  useEffect(() => {
    if (!fetchBlock.current) return;
    const block = fetchBlock.current;
    observer.observe(block);
    observer.onIntersection(() => debounced(fetchNext, 500));
    return () => observer.unobserve(block);
  }, [fetchNext]);

  const { merged: combinedMessages, sorted } = useMemo(() => {
    const messages = [
      ...[...data].reverse(),
      ...group.inComingMessages,
      ...typedMessage.get,
    ];
    const filtered = filterDuplicate(messages, (e) => e.identifier);
    const sorted = filtered.sort((a, b) =>
      moment(a.created_at).diff(b.created_at)
    );
    const merged: MergedMessage[] = [];
    sorted.forEach((message) => {
      if (merged.length === 0) {
        merged.push(createDefaultMergedMessage(message));
        return;
      }
      const lastMessage = merged[merged.length - 1];
      if (
        lastMessage.user === message.user &&
        lastMessage.minuteString === getYearToMinuteString(message.created_at)
      ) {
        lastMessage.messages.push(message);
      } else {
        merged.push(createDefaultMergedMessage(message));
      }
    });
    return { merged, sorted };
  }, [data, group.inComingMessages, typedMessage.get]);

  useEffect(() => {
    //새 메세지가 올 때, 화면 아래쪽에 있을시 자동으로 스크롤 다운
    if (group.inComingMessages.length === 0 && typedMessage.get.length === 0)
      return;
    if (isScrollDown()) setTimeout(scrollToDown, 100);
    else isNewMessage.set(true);
  }, [group.inComingMessages.length, typedMessage.get]);

  useEffect(() => {
    //새 메세지 확인버튼을 띄우는 로직
    if (!isNewMessage.get || !chatBoxRef.current) return;
    const isNewMessageButtonShowCheck = () => {
      if (!isScrollDown()) return;
      isNewMessage.set(false);
    };
    const c = chatBoxRef.current;
    c.addEventListener('scroll', isNewMessageButtonShowCheck);
    return () => c.removeEventListener('scroll', isNewMessageButtonShowCheck);
  }, [isNewMessage.get]);

  const lastScrollHeight = useRef(0);
  useEffect(() => {
    //이전 메세지 로딩시 스크롤 유지
    const c = chatBoxRef.current;
    if (!c) return;
    c.scroll({
      behavior: 'instant',
      top: c.scrollHeight - lastScrollHeight.current,
    });

    lastScrollHeight.current = c.scrollHeight;
  }, [data]);

  const { resetCount } = useUnreadedMessagesCount(user);
  useEffect(() => {
    //메세지 확인 관련
    const timeout = setTimeout(
      () => API.Messages.message.checkMessages(group.id).then(resetCount),
      // .then(() => checkAllMessagesAsReaded()),
      1000
    );
    return () => clearTimeout(timeout);
  }, [group.inComingMessages.length]);

  return (
    <Stack direction='row' minHeight='100vh' height='100vh' maxWidth='100%'>
      <Box
        // minWidth={isMd ? undefined : theme.breakpoints.values.sm}
        width='100%'
        height='100%'
        display='flex'
        flexDirection='column'
        component='form'
        onSubmit={onMessageSend}
        sx={{
          borderColor: 'divider',
          borderWidth: 1,
          borderStyle: 'solid',
          borderBottomWidth: 0,
        }}
      >
        <Stack
          flex={1}
          spacing={1}
          position='relative'
          overflow='scroll'
          className='hide-scrollbar'
          ref={chatBoxRef}
          p={1}
        >
          <Box flex={1} />
          {hasNextPage && (
            <>
              <Box display='flex' justifyContent='center'>
                <CircularProgress />
              </Box>
              <Box ref={fetchBlock} height={200}></Box>
            </>
          )}
          {combinedMessages.map((m) => (
            <MessgeItem key={m.identifier} messages={m} me={user} />
          ))}
          {isNewMessage.get && (
            <Box
              position='sticky'
              bottom='5%'
              display='flex'
              justifyContent='center'
              onClick={() => {
                scrollToDown();
                isNewMessage.set(false);
              }}
            >
              <Button
                variant='contained'
                sx={{
                  maxWidth: 128,
                }}
              >
                새 메세지 보기
              </Button>
            </Box>
          )}
        </Stack>
        <Divider />
        <TextInput
          label='새 쪽지 작성하기'
          value={message.get}
          onChange={message.onTextChange}
          size='small'
        />
        <Button type='submit' sx={{ display: 'none', visibility: 'hidden' }} />
      </Box>
    </Stack>
  );
};
