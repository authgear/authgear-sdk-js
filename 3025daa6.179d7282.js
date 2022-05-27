(window.webpackJsonp=window.webpackJsonp||[]).push([[13],{148:function(e,t,r){"use strict";r.r(t),r.d(t,"frontMatter",(function(){return o})),r.d(t,"metadata",(function(){return c})),r.d(t,"rightToc",(function(){return u})),r.d(t,"default",(function(){return l}));var n=r(2),a=r(9),i=(r(0),r(193)),o={title:"AuthorizeResult",sidebar_label:"AuthorizeResult"},c={id:"react-native/interfaces/authorizeresult",title:"AuthorizeResult",description:"@authgear/react-native \u203a AuthorizeResult",source:"@site/docs/react-native/interfaces/authorizeresult.md",permalink:"/authgear-sdk-js/docs/react-native/interfaces/authorizeresult",editUrl:"https://github.com/authgear/authgear-sdk-js/edit/master/website/docs/react-native/interfaces/authorizeresult.md",sidebar_label:"AuthorizeResult",sidebar:"root",previous:{title:"AuthorizeOptions",permalink:"/authgear-sdk-js/docs/react-native/interfaces/authorizeoptions"},next:{title:"BiometricOptions",permalink:"/authgear-sdk-js/docs/react-native/interfaces/biometricoptions"}},u=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Index",id:"index",children:[{value:"Properties",id:"properties",children:[]}]},{value:"Properties",id:"properties-1",children:[{value:'<a id="optional-state" name="optional-state"></a> <code>Optional</code> state',id:"optional-state",children:[]},{value:'<a id="userinfo" name="userinfo"></a>  userInfo',id:"userinfo",children:[]}]}],s={rightToc:u};function l(e){var t=e.components,r=Object(a.a)(e,["components"]);return Object(i.b)("wrapper",Object(n.a)({},s,r,{components:t,mdxType:"MDXLayout"}),Object(i.b)("p",null,Object(i.b)("a",Object(n.a)({parentName:"p"},{href:"/authgear-sdk-js/docs/react-native/index"}),"@authgear/react-native")," \u203a ",Object(i.b)("a",Object(n.a)({parentName:"p"},{href:"/authgear-sdk-js/docs/react-native/interfaces/authorizeresult"}),"AuthorizeResult")),Object(i.b)("p",null,"Result of authorization."),Object(i.b)("h2",{id:"hierarchy"},"Hierarchy"),Object(i.b)("ul",null,Object(i.b)("li",{parentName:"ul"},Object(i.b)("strong",{parentName:"li"},"AuthorizeResult"))),Object(i.b)("h2",{id:"index"},"Index"),Object(i.b)("h3",{id:"properties"},"Properties"),Object(i.b)("ul",null,Object(i.b)("li",{parentName:"ul"},Object(i.b)("a",Object(n.a)({parentName:"li"},{href:"/authgear-sdk-js/docs/react-native/interfaces/authorizeresult#optional-state"}),"state")),Object(i.b)("li",{parentName:"ul"},Object(i.b)("a",Object(n.a)({parentName:"li"},{href:"/authgear-sdk-js/docs/react-native/interfaces/authorizeresult#userinfo"}),"userInfo"))),Object(i.b)("h2",{id:"properties-1"},"Properties"),Object(i.b)("h3",{id:"optional-state"},Object(i.b)("a",{id:"optional-state",name:"optional-state"})," ",Object(i.b)("inlineCode",{parentName:"h3"},"Optional")," state"),Object(i.b)("p",null,"\u2022 ",Object(i.b)("strong",{parentName:"p"},"state"),"? : ",Object(i.b)("em",{parentName:"p"},"string")),Object(i.b)("p",null,"OAuth 2.0 state value."),Object(i.b)("hr",null),Object(i.b)("h3",{id:"userinfo"},Object(i.b)("a",{id:"userinfo",name:"userinfo"}),"  userInfo"),Object(i.b)("p",null,"\u2022 ",Object(i.b)("strong",{parentName:"p"},"userInfo"),": ",Object(i.b)("em",{parentName:"p"},Object(i.b)("a",Object(n.a)({parentName:"em"},{href:"/authgear-sdk-js/docs/react-native/interfaces/userinfo"}),"UserInfo"))),Object(i.b)("p",null,"UserInfo."))}l.isMDXComponent=!0},193:function(e,t,r){"use strict";r.d(t,"a",(function(){return p})),r.d(t,"b",(function(){return f}));var n=r(0),a=r.n(n);function i(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function c(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach((function(t){i(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function u(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},i=Object.keys(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var s=a.a.createContext({}),l=function(e){var t=a.a.useContext(s),r=t;return e&&(r="function"==typeof e?e(t):c(c({},t),e)),r},p=function(e){var t=l(e.components);return a.a.createElement(s.Provider,{value:t},e.children)},b={inlineCode:"code",wrapper:function(e){var t=e.children;return a.a.createElement(a.a.Fragment,{},t)}},d=a.a.forwardRef((function(e,t){var r=e.components,n=e.mdxType,i=e.originalType,o=e.parentName,s=u(e,["components","mdxType","originalType","parentName"]),p=l(r),d=n,f=p["".concat(o,".").concat(d)]||p[d]||b[d]||i;return r?a.a.createElement(f,c(c({ref:t},s),{},{components:r})):a.a.createElement(f,c({ref:t},s))}));function f(e,t){var r=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var i=r.length,o=new Array(i);o[0]=d;var c={};for(var u in t)hasOwnProperty.call(t,u)&&(c[u]=t[u]);c.originalType=e,c.mdxType="string"==typeof e?e:n,o[1]=c;for(var s=2;s<i;s++)o[s]=r[s];return a.a.createElement.apply(null,o)}return a.a.createElement.apply(null,r)}d.displayName="MDXCreateElement"}}]);