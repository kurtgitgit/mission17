import { CIVIC_TASK_CATALOG } from './civicTaskCatalog.js';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const imageDirectory = path.resolve(configDirectory, '..', 'public', 'civic-task-images');

describe('civic task catalog', () => {
  it('contains six active tasks aligned with different SDGs', () => {
    expect(CIVIC_TASK_CATALOG).toHaveLength(6);
    expect(new Set(CIVIC_TASK_CATALOG.map(task => task.sdgNumber)).size).toBe(6);
    expect(CIVIC_TASK_CATALOG.every(task => task.isActive)).toBe(true);
  });

  it('does not restore the removed points or rewards workflow', () => {
    expect(CIVIC_TASK_CATALOG.every(task => !Object.hasOwn(task, 'points'))).toBe(true);
    expect(CIVIC_TASK_CATALOG.every(task => !/reward|points?/i.test(task.description))).toBe(true);
  });

  it('uses valid mission fields and WebP task-cover sources', () => {
    for (const task of CIVIC_TASK_CATALOG) {
      expect(task.title.length).toBeGreaterThanOrEqual(3);
      expect(task.title.length).toBeLessThanOrEqual(120);
      expect(task.description.length).toBeLessThanOrEqual(1000);
      expect(task.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(task.imageFile).toMatch(/^[a-z0-9-]+\.webp$/);
    }
  });

  it('ships every referenced cover as a valid WebP file', async () => {
    for (const task of CIVIC_TASK_CATALOG) {
      const imagePath = path.join(imageDirectory, task.imageFile);
      await expect(access(imagePath)).resolves.toBeUndefined();
      const header = (await readFile(imagePath)).subarray(0, 12);
      expect(header.subarray(0, 4).toString('ascii')).toBe('RIFF');
      expect(header.subarray(8, 12).toString('ascii')).toBe('WEBP');
    }
  });
});
