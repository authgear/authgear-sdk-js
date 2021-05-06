(window.webpackJsonp=window.webpackJsonp||[]).push([[34],{170:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return a})),n.d(t,"metadata",(function(){return s})),n.d(t,"rightToc",(function(){return c})),n.d(t,"default",(function(){return b}));var i=n(2),r=n(9),o=(n(0),n(176)),a={title:"ConfigureOptions",sidebar_label:"ConfigureOptions"},s={id:"web/interfaces/configureoptions",title:"ConfigureOptions",description:"@authgear/web \u203a ConfigureOptions",source:"@site/docs/web/interfaces/configureoptions.md",permalink:"/authgear-sdk-js/docs/web/interfaces/configureoptions",editUrl:"https://github.com/authgear/authgear-sdk-js/edit/master/website/docs/web/interfaces/configureoptions.md",sidebar_label:"ConfigureOptions",sidebar:"root",previous:{title:"AuthorizeResult",permalink:"/authgear-sdk-js/docs/web/interfaces/authorizeresult"},next:{title:"ContainerOptions",permalink:"/authgear-sdk-js/docs/web/interfaces/containeroptions"}},c=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Index",id:"index",children:[{value:"Properties",id:"properties",children:[]}]},{value:"Properties",id:"properties-1",children:[{value:'<a id="clientid" name="clientid"></a>  clientID',id:"clientid",children:[]},{value:'<a id="endpoint" name="endpoint"></a>  endpoint',id:"endpoint",children:[]},{value:'<a id="optional-sessiontype" name="optional-sessiontype"></a> <code>Optional</code> sessionType',id:"optional-sessiontype",children:[]},{value:'<a id="optional-transientsession" name="optional-transientsession"></a> <code>Optional</code> transientSession',id:"optional-transientsession",children:[]}]}],p={rightToc:c};function b(e){var t=e.components,n=Object(r.a)(e,["components"]);return Object(o.b)("wrapper",Object(i.a)({},p,n,{components:t,mdxType:"MDXLayout"}),Object(o.b)("p",null,Object(o.b)("a",Object(i.a)({parentName:"p"},{href:"/authgear-sdk-js/docs/web/index"}),"@authgear/web")," \u203a ",Object(o.b)("a",Object(i.a)({parentName:"p"},{href:"/authgear-sdk-js/docs/web/interfaces/configureoptions"}),"ConfigureOptions")),Object(o.b)("h2",{id:"hierarchy"},"Hierarchy"),Object(o.b)("ul",null,Object(o.b)("li",{parentName:"ul"},Object(o.b)("strong",{parentName:"li"},"ConfigureOptions"))),Object(o.b)("h2",{id:"index"},"Index"),Object(o.b)("h3",{id:"properties"},"Properties"),Object(o.b)("ul",null,Object(o.b)("li",{parentName:"ul"},Object(o.b)("a",Object(i.a)({parentName:"li"},{href:"/authgear-sdk-js/docs/web/interfaces/configureoptions#clientid"}),"clientID")),Object(o.b)("li",{parentName:"ul"},Object(o.b)("a",Object(i.a)({parentName:"li"},{href:"/authgear-sdk-js/docs/web/interfaces/configureoptions#endpoint"}),"endpoint")),Object(o.b)("li",{parentName:"ul"},Object(o.b)("a",Object(i.a)({parentName:"li"},{href:"/authgear-sdk-js/docs/web/interfaces/configureoptions#optional-sessiontype"}),"sessionType")),Object(o.b)("li",{parentName:"ul"},Object(o.b)("a",Object(i.a)({parentName:"li"},{href:"/authgear-sdk-js/docs/web/interfaces/configureoptions#optional-transientsession"}),"transientSession"))),Object(o.b)("h2",{id:"properties-1"},"Properties"),Object(o.b)("h3",{id:"clientid"},Object(o.b)("a",{id:"clientid",name:"clientid"}),"  clientID"),Object(o.b)("p",null,"\u2022 ",Object(o.b)("strong",{parentName:"p"},"clientID"),": ",Object(o.b)("em",{parentName:"p"},"string")),Object(o.b)("p",null,"The OAuth client ID."),Object(o.b)("hr",null),Object(o.b)("h3",{id:"endpoint"},Object(o.b)("a",{id:"endpoint",name:"endpoint"}),"  endpoint"),Object(o.b)("p",null,"\u2022 ",Object(o.b)("strong",{parentName:"p"},"endpoint"),": ",Object(o.b)("em",{parentName:"p"},"string")),Object(o.b)("p",null,"The endpoint."),Object(o.b)("hr",null),Object(o.b)("h3",{id:"optional-sessiontype"},Object(o.b)("a",{id:"optional-sessiontype",name:"optional-sessiontype"})," ",Object(o.b)("inlineCode",{parentName:"h3"},"Optional")," sessionType"),Object(o.b)("p",null,"\u2022 ",Object(o.b)("strong",{parentName:"p"},"sessionType"),"? : ",Object(o.b)("em",{parentName:"p"},'"cookie" | "refresh_token"')),Object(o.b)("p",null,"sessionType indicates how session is supposed to be stored.\nThis must match the server side configuration."),Object(o.b)("p",null,"If your backend is a server-side rendering website or webapp,\nthen you should use cookie."),Object(o.b)("p",null,'Normally, you need to set up a custom domain so that\nyour backend and Authgear can both read and write cookie in the same root domain.\nYou also need to tell the SDK cookie is being used, by specifying "cookie" here.'),Object(o.b)("p",null,'If not specified, default to "refresh_token".'),Object(o.b)("hr",null),Object(o.b)("h3",{id:"optional-transientsession"},Object(o.b)("a",{id:"optional-transientsession",name:"optional-transientsession"})," ",Object(o.b)("inlineCode",{parentName:"h3"},"Optional")," transientSession"),Object(o.b)("p",null,"\u2022 ",Object(o.b)("strong",{parentName:"p"},"transientSession"),"? : ",Object(o.b)("em",{parentName:"p"},"boolean")),Object(o.b)("p",null,"transientSession indicate if the session in SDK is short-lived session.\nIf transientSession is true means the session is short-lived session.\nIn web, the session will be stored in sessionStorage, that means it only persists within the same browser tab."))}b.isMDXComponent=!0},176:function(e,t,n){"use strict";n.d(t,"a",(function(){return l})),n.d(t,"b",(function(){return O}));var i=n(0),r=n.n(i);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,i)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function c(e,t){if(null==e)return{};var n,i,r=function(e,t){if(null==e)return{};var n,i,r={},o=Object.keys(e);for(i=0;i<o.length;i++)n=o[i],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(i=0;i<o.length;i++)n=o[i],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var p=r.a.createContext({}),b=function(e){var t=r.a.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},l=function(e){var t=b(e.components);return r.a.createElement(p.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.a.createElement(r.a.Fragment,{},t)}},d=r.a.forwardRef((function(e,t){var n=e.components,i=e.mdxType,o=e.originalType,a=e.parentName,p=c(e,["components","mdxType","originalType","parentName"]),l=b(n),d=i,O=l["".concat(a,".").concat(d)]||l[d]||u[d]||o;return n?r.a.createElement(O,s(s({ref:t},p),{},{components:n})):r.a.createElement(O,s({ref:t},p))}));function O(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var o=n.length,a=new Array(o);a[0]=d;var s={};for(var c in t)hasOwnProperty.call(t,c)&&(s[c]=t[c]);s.originalType=e,s.mdxType="string"==typeof e?e:i,a[1]=s;for(var p=2;p<o;p++)a[p]=n[p];return r.a.createElement.apply(null,a)}return r.a.createElement.apply(null,n)}d.displayName="MDXCreateElement"}}]);