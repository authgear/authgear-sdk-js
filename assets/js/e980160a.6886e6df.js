"use strict";(self.webpackChunksite=self.webpackChunksite||[]).push([[1840],{3905:function(e,t,r){r.d(t,{Zo:function(){return l},kt:function(){return d}});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function o(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function s(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},i=Object.keys(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var u=n.createContext({}),c=function(e){var t=n.useContext(u),r=t;return e&&(r="function"==typeof e?e(t):o(o({},t),e)),r},l=function(e){var t=c(e.components);return n.createElement(u.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},f=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,i=e.originalType,u=e.parentName,l=s(e,["components","mdxType","originalType","parentName"]),f=c(r),d=a,v=f["".concat(u,".").concat(d)]||f[d]||p[d]||i;return r?n.createElement(v,o(o({ref:t},l),{},{components:r})):n.createElement(v,o({ref:t},l))}));function d(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=r.length,o=new Array(i);o[0]=f;var s={};for(var u in t)hasOwnProperty.call(t,u)&&(s[u]=t[u]);s.originalType=e,s.mdxType="string"==typeof e?e:a,o[1]=s;for(var c=2;c<i;c++)o[c]=r[c];return n.createElement.apply(null,o)}return n.createElement.apply(null,r)}f.displayName="MDXCreateElement"},6641:function(e,t,r){r.r(t),r.d(t,{assets:function(){return l},contentTitle:function(){return u},default:function(){return d},frontMatter:function(){return s},metadata:function(){return c},toc:function(){return p}});var n=r(3117),a=r(102),i=(r(7294),r(3905)),o=["components"],s={},u=void 0,c={unversionedId:"react-native/interfaces/AuthorizeResult",id:"react-native/interfaces/AuthorizeResult",title:"AuthorizeResult",description:"@authgear/react-native / AuthorizeResult",source:"@site/docs/react-native/interfaces/AuthorizeResult.md",sourceDirName:"react-native/interfaces",slug:"/react-native/interfaces/AuthorizeResult",permalink:"/authgear-sdk-js/docs/react-native/interfaces/AuthorizeResult",draft:!1,editUrl:"https://github.com/authgear/authgear-sdk-js/edit/master/website/docs/react-native/interfaces/AuthorizeResult.md",tags:[],version:"current",frontMatter:{},sidebar:"root",previous:{title:"AuthorizeOptions",permalink:"/authgear-sdk-js/docs/react-native/interfaces/AuthorizeOptions"},next:{title:"BiometricOptions",permalink:"/authgear-sdk-js/docs/react-native/interfaces/BiometricOptions"}},l={},p=[{value:"Table of contents",id:"table-of-contents",level:2},{value:"Properties",id:"properties",level:3},{value:"Properties",id:"properties-1",level:2},{value:'<a id="state" name="state"></a> state',id:"-state",level:3},{value:"Defined in",id:"defined-in",level:4},{value:'<a id="userinfo" name="userinfo"></a> userInfo',id:"-userinfo",level:3},{value:"Defined in",id:"defined-in-1",level:4}],f={toc:p};function d(e){var t=e.components,r=(0,a.Z)(e,o);return(0,i.kt)("wrapper",(0,n.Z)({},f,r,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native"},"@authgear/react-native")," / AuthorizeResult"),(0,i.kt)("h1",{id:"interface-authorizeresult"},"Interface: AuthorizeResult"),(0,i.kt)("p",null,"Result of authorization."),(0,i.kt)("h2",{id:"table-of-contents"},"Table of contents"),(0,i.kt)("h3",{id:"properties"},"Properties"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/interfaces/AuthorizeResult#state"},"state")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/react-native/interfaces/AuthorizeResult#userinfo"},"userInfo"))),(0,i.kt)("h2",{id:"properties-1"},"Properties"),(0,i.kt)("h3",{id:"-state"},(0,i.kt)("a",{id:"state",name:"state"})," state"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,i.kt)("strong",{parentName:"p"},"state"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"OAuth 2.0 state value."),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,"packages/authgear-react-native/index.d.ts:26"),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"-userinfo"},(0,i.kt)("a",{id:"userinfo",name:"userinfo"})," userInfo"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"userInfo"),": ",(0,i.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/react-native/interfaces/UserInfo"},(0,i.kt)("inlineCode",{parentName:"a"},"UserInfo"))),(0,i.kt)("p",null,"UserInfo."),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,"packages/authgear-react-native/index.d.ts:30"))}d.isMDXComponent=!0}}]);