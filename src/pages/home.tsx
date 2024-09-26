import useValue from '#/hooks/useValue';
import { ArrowBack, Close } from '@mui/icons-material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import {
  Box,
  Button,
  Dialog,
  Divider,
  Fade,
  IconButton,
  Paper,
  Stack,
  Tab,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import DraftEditor from '#/PostWriter/DraftEditor';
import API from '#/api';
import CommonLayout from '#/components/layouts/CommonLayout';
import { Block } from '#/utils/textEditor/blockTypes';
import { SyntheticEvent, useEffect, useRef } from 'react';
import { Post } from '#/api/posts';
import { PostTimeline } from '#/components/timelines';
import useUser from '#/hooks/useUser';
import { useLoginWindow } from '#/hooks/useLoginWindow';
// import PostWriter from '#/PostWriter';
// const DraftEditor = dynamic(() => import('#/PostWriter/DraftEditor'), {
//   ssr: true,
// });

const Home = () => {
  const theme = useTheme();
  const [user] = useUser();
  const tabValue = useValue('1');
  const [openLoginWindow] = useLoginWindow();

  const handleChange = (event: SyntheticEvent, newValue: string) => {
    return openLoginWindow();
    if (!user) return openLoginWindow();
    tabValue.set(newValue);
  };
  const onPost = (text: string, blocks: Block[][]) => {
    const mentions = blocks
      .map((line) => line.filter((block) => block.type === 'mention'))
      .flatMap((block) => block)
      .map((block) => ({ mentioned_to: parseInt(block.id) }));
    API.Posts.post.postItem({ text, blocks, mentions });
  };

  return (
    <Box>
      <TabContext value={user ? tabValue.get : '1'}>
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            position: 'sticky',
            top: 0,
            backdropFilter: 'blur(5px)',
          }}
        >
          <TabList
            onChange={handleChange}
            aria-label='lab API tabs example'
            sx={{ button: { width: '50%' } }}
          >
            <Tab label='추천' value='1' />
            <Tab label='팔로우 중' value='2' />
          </TabList>
        </Box>
        <TabPanel value='1'>
          <PostTimeline
            getter={API.Posts.post.getGlobalTimeline}
            type='global'
          />
        </TabPanel>
        <TabPanel value='2'>
          <DraftEditor onPost={onPost} />
          <PostTimeline
            getter={API.Posts.post.getFollowingTimeline}
            type='followings'
          />
        </TabPanel>
      </TabContext>
    </Box>
  );
};
export default Home;
