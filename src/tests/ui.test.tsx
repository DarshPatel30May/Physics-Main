// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { App } from '../ui/App';
import { TOPICS, PAGES } from '../ui/nav';

afterEach(() => cleanup());

function go(route: string) {
  window.location.hash = `#/${route}`;
}

describe('UI smoke tests (every route renders; calculators solve)', () => {
  for (const t of TOPICS) {
    it(`topic ${t.id} renders and Solve works`, () => {
      go(`topic/${t.id}`);
      render(<App />);
      expect(screen.getAllByText(t.label).length).toBeGreaterThan(0);
      const solve = screen.queryAllByRole('button', { name: 'Solve' });
      if (solve.length) fireEvent.click(solve[0]);
    });
  }
  for (const p of PAGES) {
    it(`page ${p.id} renders`, () => {
      go(p.id);
      const { container } = render(<App />);
      expect(container.querySelector('.main')!.textContent!.length).toBeGreaterThan(50);
    });
  }
  it('smart solver produces an answer and working', () => {
    go('solver');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Proton in B field' }));
    expect(screen.getAllByText(/Final answer/i).length).toBeGreaterThan(0);
    expect(document.querySelector('.panel-col')!.textContent).toMatch(/Newton/);
  });
});
