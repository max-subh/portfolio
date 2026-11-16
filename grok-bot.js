import { createAvatar } from '@bible-strong/avatar-web';
import character from './grok-bot.avatar.json';

const target = document.querySelector('[data-grok-avatar]');
const status = document.querySelector('[data-grok-status]');

if (target && status) {
  try {
    createAvatar(target, {
      character,
      state: 'idle',
      size: '100%',
      followPointer: true,
      ariaLabel: 'Grok bot animated avatar'
    });
    status.textContent = 'pogo · ONLINE';
  } catch (error) {
    console.error('Could not load the Grok bot avatar:', error);
    status.textContent = 'pogo · OFFLINE';
  }
}
