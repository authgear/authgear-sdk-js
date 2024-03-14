(window.webpackJsonp=window.webpackJsonp||[]).push([[42],{178:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return o})),n.d(t,"metadata",(function(){return c})),n.d(t,"rightToc",(function(){return p})),n.d(t,"default",(function(){return l}));var r=n(2),i=n(9),a=(n(0),n(187)),o={title:"ConfigureOptions",sidebar_label:"ConfigureOptions"},c={id:"web/interfaces/configureoptions",title:"ConfigureOptions",description:"@authgear/web \u203a ConfigureOptions",source:"@site/docs/web/interfaces/configureoptions.md",permalink:"/authgear-sdk-js/docs/web/interfaces/configureoptions",editUrl:"https://github.com/authgear/authgear-sdk-js/edit/master/website/docs/web/interfaces/configureoptions.md",sidebar_label:"ConfigureOptions",sidebar:"root",previous:{title:"ChallengeResponse",permalink:"/authgear-sdk-js/docs/web/interfaces/challengeresponse"},next:{title:"ContainerDelegate",permalink:"/authgear-sdk-js/docs/web/interfaces/containerdelegate"}},p=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Index",id:"index",children:[{value:"Properties",id:"properties",children:[]}]},{value:"Properties",id:"properties-1",children:[{value:'<a id="clientid" name="clientid"></a>  clientID',id:"clientid",children:[]},{value:'<a id="endpoint" name="endpoint"></a>  endpoint',id:"endpoint",children:[]},{value:'<a id="optional-isthirdpartyapp" name="optional-isthirdpartyapp"></a> <code>Optional</code> isThirdPartyApp',id:"optional-isthirdpartyapp",children:[]},{value:'<a id="optional-skiprefreshaccesstoken" name="optional-skiprefreshaccesstoken"></a> <code>Optional</code> skipRefreshAccessToken',id:"optional-skiprefreshaccesstoken",children:[]}]}],s={rightToc:p};function l(e){var t=e.components,n=Object(i.a)(e,["components"]);return Object(a.b)("wrapper",Object(r.a)({},s,n,{components:t,mdxType:"MDXLayout"}),Object(a.b)("p",null,Object(a.b)("a",Object(r.a)({parentName:"p"},{href:"/authgear-sdk-js/docs/web/index"}),"@authgear/web")," \u203a ",Object(a.b)("a",Object(r.a)({parentName:"p"},{href:"/authgear-sdk-js/docs/web/interfaces/configureoptions"}),"ConfigureOptions")),Object(a.b)("h2",{id:"hierarchy"},"Hierarchy"),Object(a.b)("ul",null,Object(a.b)("li",{parentName:"ul"},Object(a.b)("strong",{parentName:"li"},"ConfigureOptions"))),Object(a.b)("h2",{id:"index"},"Index"),Object(a.b)("h3",{id:"properties"},"Properties"),Object(a.b)("ul",null,Object(a.b)("li",{parentName:"ul"},Object(a.b)("a",Object(r.a)({parentName:"li"},{href:"/authgear-sdk-js/docs/web/interfaces/configureoptions#clientid"}),"clientID")),Object(a.b)("li",{parentName:"ul"},Object(a.b)("a",Object(r.a)({parentName:"li"},{href:"/authgear-sdk-js/docs/web/interfaces/configureoptions#endpoint"}),"endpoint")),Object(a.b)("li",{parentName:"ul"},Object(a.b)("a",Object(r.a)({parentName:"li"},{href:"/authgear-sdk-js/docs/web/interfaces/configureoptions#optional-isthirdpartyapp"}),"isThirdPartyApp")),Object(a.b)("li",{parentName:"ul"},Object(a.b)("a",Object(r.a)({parentName:"li"},{href:"/authgear-sdk-js/docs/web/interfaces/configureoptions#optional-skiprefreshaccesstoken"}),"skipRefreshAccessToken"))),Object(a.b)("h2",{id:"properties-1"},"Properties"),Object(a.b)("h3",{id:"clientid"},Object(a.b)("a",{id:"clientid",name:"clientid"}),"  clientID"),Object(a.b)("p",null,"\u2022 ",Object(a.b)("strong",{parentName:"p"},"clientID"),": ",Object(a.b)("em",{parentName:"p"},"string")),Object(a.b)("p",null,"The OAuth client ID."),Object(a.b)("hr",null),Object(a.b)("h3",{id:"endpoint"},Object(a.b)("a",{id:"endpoint",name:"endpoint"}),"  endpoint"),Object(a.b)("p",null,"\u2022 ",Object(a.b)("strong",{parentName:"p"},"endpoint"),": ",Object(a.b)("em",{parentName:"p"},"string")),Object(a.b)("p",null,"The endpoint."),Object(a.b)("hr",null),Object(a.b)("h3",{id:"optional-isthirdpartyapp"},Object(a.b)("a",{id:"optional-isthirdpartyapp",name:"optional-isthirdpartyapp"})," ",Object(a.b)("inlineCode",{parentName:"h3"},"Optional")," isThirdPartyApp"),Object(a.b)("p",null,"\u2022 ",Object(a.b)("strong",{parentName:"p"},"isThirdPartyApp"),"? : ",Object(a.b)("em",{parentName:"p"},"boolean")),Object(a.b)("p",null,"isThirdPartyApp indicate if the application a third party app.\nA third party app means the app doesn't share common-domain with Authgear thus the session cookie cannot be shared.\nIf not specified, default to false. So by default the application is considered first party."),Object(a.b)("hr",null),Object(a.b)("h3",{id:"optional-skiprefreshaccesstoken"},Object(a.b)("a",{id:"optional-skiprefreshaccesstoken",name:"optional-skiprefreshaccesstoken"})," ",Object(a.b)("inlineCode",{parentName:"h3"},"Optional")," skipRefreshAccessToken"),Object(a.b)("p",null,"\u2022 ",Object(a.b)("strong",{parentName:"p"},"skipRefreshAccessToken"),"? : ",Object(a.b)("em",{parentName:"p"},"boolean")),Object(a.b)("p",null,"Skip refreshing access token. Default is false."))}l.isMDXComponent=!0},187:function(e,t,n){"use strict";n.d(t,"a",(function(){return b})),n.d(t,"b",(function(){return f}));var r=n(0),i=n.n(r);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function p(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var s=i.a.createContext({}),l=function(e){var t=i.a.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):c(c({},t),e)),n},b=function(e){var t=l(e.components);return i.a.createElement(s.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return i.a.createElement(i.a.Fragment,{},t)}},u=i.a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,a=e.originalType,o=e.parentName,s=p(e,["components","mdxType","originalType","parentName"]),b=l(n),u=r,f=b["".concat(o,".").concat(u)]||b[u]||d[u]||a;return n?i.a.createElement(f,c(c({ref:t},s),{},{components:n})):i.a.createElement(f,c({ref:t},s))}));function f(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var a=n.length,o=new Array(a);o[0]=u;var c={};for(var p in t)hasOwnProperty.call(t,p)&&(c[p]=t[p]);c.originalType=e,c.mdxType="string"==typeof e?e:r,o[1]=c;for(var s=2;s<a;s++)o[s]=n[s];return i.a.createElement.apply(null,o)}return i.a.createElement.apply(null,n)}u.displayName="MDXCreateElement"}}]);