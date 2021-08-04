'use strict';

const AbstractWorker = require('./AbstractWorker');
const VGPostWorker = require('./VGPostWorker');
const ViperGirls = require('../rippers/ViperGirls');
const save = require('../tools/save');
const store = require('../store');
const settings = store.data._;

function makeThreadDest(thread, suffix) {
  const { id, title, forum } = thread;
  let page = thread.page ? '_' + thread.page : '';
  const prefix = settings.prefixMain ? `vg${id}${page} ` : '';
  const forumsub = settings.forumFolder ? forum : '';
  return save.makePath(store.data._.root, [forumsub, prefix + title + suffix]);
}

function makePostDest(onePost, threadDest, postobj) {
  const { index, title, id } = postobj;
  if (onePost || !settings.subfolders) {
    return threadDest;
  }

  const prefix = settings.prefixPost ? `post ${index} - ` : '';
  const suffix = settings.suffixPost ? ` ${id}` : '';
  const placeholder = `post ${index}`;
  if (!title) {
    return save.makePath(threadDest, [placeholder + suffix]);
  }
  return save.makePath(threadDest, [prefix + title + suffix]);
}

class VGThreadWorker extends AbstractWorker {
  static get type() {
    return 'VGThread';
  }

  static parseURL(url) {
    const parsedURL = ViperGirls.parseURL(url);
    return parsedURL.threadId ? { id: parsedURL.threadId, page: parsedURL.pageId } : { err: true };
  }

  static preload(task) {
    return ViperGirls.load(task.url).then((thread) => {
      const onePost = thread.posts.length === 1;
      thread.title = thread.title.replace(/([^\x00-\x7F])/g, '-'); // UTF8 special chars
      const dest = makeThreadDest(thread, onePost && settings.suffixPost ? ` ${thread.posts[0].id}` : '');
      let total = 0;

      // create subtasks
      const posts = thread.posts.map((post) => {
        total += post.pics.length;
        return VGPostWorker.create(
          {
            $parent: task.$id,
            title: post.title,
            id: post.id,
            index: post.index,
            thanks: post.thanks,
            url: ViperGirls.makePostURL(post.id),
            dest: makePostDest(onePost, dest, post)
          },
          post.pics
        ).$id;
      });

      return store.updateItem(task, {
        $sub: posts,
        title: thread.title,
        forum: thread.forum,
        id: thread.id,
        page: thread.page,
        uiExpand: !onePost,
        pTotal: total,
        pDone: 0,
        pErr: 0,
        dest: dest,
        onePost: onePost
      });
    });
  }

  static load(task) {
    if (Array.isArray(task.$sub)) {
      for (let $subId of task.$sub) {
        setImmediate(() => VGPostWorker.start(store.getItem($subId)));
      }
    }
  }
}

module.exports = VGThreadWorker;
