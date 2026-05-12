export interface Macro {
  name: string;        // command name without backslash
  argCount: number;
  render: (args: string[], recurse: (s: string) => string) => string;
}

export const RESUME_MACROS: Macro[] = [
  {
    name: 'section',
    argCount: 1,
    render: ([title], r) =>
      `<h2 class="latex-section">${r(title)}</h2><hr class="latex-hr"/>`,
  },
  {
    name: 'subsection',
    argCount: 1,
    render: ([title], r) =>
      `<h3 class="latex-subsection">${r(title)}</h3>`,
  },
  {
    name: 'resumeSubheading',
    argCount: 4,
    render: ([company, date, role, loc], r) => `
      <div class="latex-resume-subheading">
        <div class="latex-resume-row">
          <span class="latex-resume-company">${r(company)}</span>
          <span class="latex-resume-date">${r(date)}</span>
        </div>
        <div class="latex-resume-row">
          <span class="latex-resume-role">${r(role)}</span>
          <span class="latex-resume-loc">${r(loc)}</span>
        </div>
      </div>`,
  },
  {
    name: 'resumeItem',
    argCount: 1,
    render: ([text], r) => `<li class="latex-resume-item">${r(text)}</li>`,
  },
  {
    name: 'resumeItemListStart',
    argCount: 0,
    render: () => `<ul class="latex-resume-item-list">`,
  },
  {
    name: 'resumeItemListEnd',
    argCount: 0,
    render: () => `</ul>`,
  },
  {
    name: 'resumeSubHeadingListStart',
    argCount: 0,
    render: () => `<div class="latex-resume-list">`,
  },
  {
    name: 'resumeSubHeadingListEnd',
    argCount: 0,
    render: () => `</div>`,
  },
  { 
    name: 'textbf', 
    argCount: 1, 
    render: ([t], r) => `<strong>${r(t)}</strong>` 
  },
  { 
    name: 'textit', 
    argCount: 1, 
    render: ([t], r) => `<em>${r(t)}</em>` 
  },
  { 
    name: 'underline', 
    argCount: 1, 
    render: ([t], r) => `<u>${r(t)}</u>` 
  },
  { 
    name: 'emph', 
    argCount: 1, 
    render: ([t], r) => `<em>${r(t)}</em>` 
  },
  { 
    name: 'myuline', 
    argCount: 1, 
    render: ([t], r) => `<u>${r(t)}</u>` 
  },
  {
    name: 'href',
    argCount: 2,
    render: ([url, label], r) =>
      `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer" class="latex-link">${r(label)}</a>`,
  },
  {
    name: 'url',
    argCount: 1,
    render: ([url]) =>
      `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer" class="latex-link">${url}</a>`,
  },
];

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
