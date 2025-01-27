"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[642],{5410:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>c,contentTitle:()=>i,default:()=>x,frontMatter:()=>d,metadata:()=>l,toc:()=>h});var r=s(5893),n=s(1151);const d={id:"table",title:"table",sidebar_label:"table"},i=void 0,l={id:"reference/table",title:"table",description:'table is a table operator that does not perform any semantic function (it is a "no-op"), but exists for syntactic reasons in order to prevent the mis-interpretation of other table operators as cell content.',source:"@site/docs/reference/table.md",sourceDirName:"reference",slug:"/reference/table",permalink:"/gramble/docs/reference/table",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{id:"table",title:"table",sidebar_label:"table"},sidebar:"tutorialSidebar",previous:{title:"starts",permalink:"/gramble/docs/reference/starts"},next:{title:"Multiple tiers",permalink:"/gramble/docs/multiTier"}},c={},h=[{value:"Usage examples",id:"usage-examples",level:2}];function o(e){const t={code:"code",h1:"h1",h2:"h2",p:"p",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,n.a)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(t.p,{children:[(0,r.jsx)(t.code,{children:"table"}),' is a table operator that does not perform any semantic function (it is a "no-op"), but exists for syntactic reasons in order to prevent the mis-interpretation of other table operators as cell content.']}),"\n",(0,r.jsx)(t.h2,{id:"usage-examples",children:"Usage examples"}),"\n",(0,r.jsx)(t.p,{children:"To show why this is needed, consider the following source code:"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:(0,r.jsx)(t.strong,{children:"A ="})}),(0,r.jsx)(t.th,{children:(0,r.jsx)(t.strong,{children:"text"})}),(0,r.jsx)(t.th,{children:(0,r.jsx)(t.strong,{children:"person"})}),(0,r.jsx)(t.th,{})]})}),(0,r.jsxs)(t.tbody,{children:[(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"pa"}),(0,r.jsx)(t.td,{children:"1sg"}),(0,r.jsx)(t.td,{})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"na"}),(0,r.jsx)(t.td,{children:"2sg"}),(0,r.jsx)(t.td,{})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"i"}),(0,r.jsx)(t.td,{children:"3sg"}),(0,r.jsx)(t.td,{})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"\xa0"}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:(0,r.jsx)(t.strong,{children:"join:"})}),(0,r.jsx)(t.td,{children:(0,r.jsx)(t.strong,{children:"person"})}),(0,r.jsx)(t.td,{children:(0,r.jsx)(t.strong,{children:"eng"})})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"1sg"}),(0,r.jsx)(t.td,{children:"I"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"2sg"}),(0,r.jsx)(t.td,{children:"you"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"3sg"}),(0,r.jsx)(t.td,{children:"he/she/it"})]})]})]}),"\n",(0,r.jsxs)(t.p,{children:["The programmer is trying to ",(0,r.jsx)(t.code,{children:"join"})," the second table to the first.  However, ",(0,r.jsx)(t.code,{children:"join:"})," doesn't get interpreted by the parser as a operator, it gets interpreted as text in the ",(0,r.jsx)(t.code,{children:"text"})," field above."]}),"\n",(0,r.jsxs)(t.p,{children:["Remember, blank lines in Gramble aren't meaningful, they're just ignored.  Everything below ",(0,r.jsx)(t.code,{children:"text"})," here will be interpreted as text until the enclosure of ",(0,r.jsx)(t.code,{children:"A"})," is actually broken by an operator under ",(0,r.jsx)(t.code,{children:"A"}),".  And ",(0,r.jsx)(t.code,{children:"join:"})," is perfectly valid text, there's nothing wrong with text ending in ':'.   (That is to say, being-an-operator and not-being-an-operator are primarily structural, not based on whether a string ends in ':'.)"]}),"\n",(0,r.jsxs)(t.p,{children:["For ",(0,r.jsx)(t.code,{children:"join:"})," to be interpreted as an operator here, it needs to be under another operator, not under a header like ",(0,r.jsx)(t.code,{children:"text"}),".  That's what ",(0,r.jsx)(t.code,{children:"table:"})," is for; it does not do anything semantically, but fills the syntactic role of the first operator in a chain of sibling operators."]}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:(0,r.jsx)(t.strong,{children:"A ="})}),(0,r.jsx)(t.th,{children:(0,r.jsx)(t.strong,{children:"table:"})}),(0,r.jsx)(t.th,{children:(0,r.jsx)(t.strong,{children:"text"})}),(0,r.jsx)(t.th,{children:(0,r.jsx)(t.strong,{children:"person"})})]})}),(0,r.jsxs)(t.tbody,{children:[(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"pa"}),(0,r.jsx)(t.td,{children:"1sg"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"na"}),(0,r.jsx)(t.td,{children:"2sg"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"i"}),(0,r.jsx)(t.td,{children:"3sg"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"\xa0"}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:(0,r.jsx)(t.strong,{children:"join:"})}),(0,r.jsx)(t.td,{children:(0,r.jsx)(t.strong,{children:"person"})}),(0,r.jsx)(t.td,{children:(0,r.jsx)(t.strong,{children:"eng"})})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"1sg"}),(0,r.jsx)(t.td,{children:"I"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"2sg"}),(0,r.jsx)(t.td,{children:"you"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"3sg"}),(0,r.jsx)(t.td,{children:"he/she/it"})]})]})]}),"\n",(0,r.jsx)(t.h1,{id:"an-alternative",children:"An alternative"}),"\n",(0,r.jsxs)(t.p,{children:["For convenience, all table operators like ",(0,r.jsx)(t.code,{children:"join"}),", ",(0,r.jsx)(t.code,{children:"replace"}),", etc. can also serve as the direct siblings of assignments, with the same semantics as the above.  (That is to say, rather than ",(0,r.jsx)(t.code,{children:"table:"})," be the first operator in a chain of sibling operators, the assignment can be.)"]}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:(0,r.jsx)(t.strong,{children:"A ="})}),(0,r.jsx)(t.th,{children:(0,r.jsx)(t.strong,{children:"text"})}),(0,r.jsx)(t.th,{children:(0,r.jsx)(t.strong,{children:"person"})})]})}),(0,r.jsxs)(t.tbody,{children:[(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"pa"}),(0,r.jsx)(t.td,{children:"1sg"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"na"}),(0,r.jsx)(t.td,{children:"2sg"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"i"}),(0,r.jsx)(t.td,{children:"3sg"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"\xa0"}),(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:(0,r.jsx)(t.strong,{children:"join:"})}),(0,r.jsx)(t.td,{children:(0,r.jsx)(t.strong,{children:"person"})}),(0,r.jsx)(t.td,{children:(0,r.jsx)(t.strong,{children:"eng"})})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"1sg"}),(0,r.jsx)(t.td,{children:"I"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"2sg"}),(0,r.jsx)(t.td,{children:"you"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{}),(0,r.jsx)(t.td,{children:"3sg"}),(0,r.jsx)(t.td,{children:"he/she/it"})]})]})]}),"\n",(0,r.jsxs)(t.p,{children:["Some programmers prefer this style (because it conserves horizontal space), other programmers prefer the style with ",(0,r.jsx)(t.code,{children:"table:"})," because they find it visually clearer when assignments and operators are in separate columns."]})]})}function x(e={}){const{wrapper:t}={...(0,n.a)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(o,{...e})}):o(e)}},1151:(e,t,s)=>{s.d(t,{Z:()=>l,a:()=>i});var r=s(7294);const n={},d=r.createContext(n);function i(e){const t=r.useContext(d);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:i(e.components),r.createElement(d.Provider,{value:t},e.children)}}}]);