"use strict";(self.webpackChunksite=self.webpackChunksite||[]).push([[1770],{3905:function(e,t,n){n.d(t,{Zo:function(){return c},kt:function(){return d}});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var u=r.createContext({}),l=function(e){var t=r.useContext(u),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},c=function(e){var t=l(e.components);return r.createElement(u.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},f=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,i=e.originalType,u=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),f=l(n),d=a,h=f["".concat(u,".").concat(d)]||f[d]||p[d]||i;return n?r.createElement(h,o(o({ref:t},c),{},{components:n})):r.createElement(h,o({ref:t},c))}));function d(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=n.length,o=new Array(i);o[0]=f;var s={};for(var u in t)hasOwnProperty.call(t,u)&&(s[u]=t[u]);s.originalType=e,s.mdxType="string"==typeof e?e:a,o[1]=s;for(var l=2;l<i;l++)o[l]=n[l];return r.createElement.apply(null,o)}return r.createElement.apply(null,n)}f.displayName="MDXCreateElement"},3483:function(e,t,n){n.r(t),n.d(t,{assets:function(){return c},contentTitle:function(){return u},default:function(){return d},frontMatter:function(){return s},metadata:function(){return l},toc:function(){return p}});var r=n(3117),a=n(102),i=(n(7294),n(3905)),o=["components"],s={},u=void 0,l={unversionedId:"web/interfaces/ReauthenticateResult",id:"web/interfaces/ReauthenticateResult",title:"ReauthenticateResult",description:"@authgear/web / ReauthenticateResult",source:"@site/docs/web/interfaces/ReauthenticateResult.md",sourceDirName:"web/interfaces",slug:"/web/interfaces/ReauthenticateResult",permalink:"/authgear-sdk-js/docs/web/interfaces/ReauthenticateResult",draft:!1,editUrl:"https://github.com/authgear/authgear-sdk-js/edit/master/website/docs/web/interfaces/ReauthenticateResult.md",tags:[],version:"current",frontMatter:{},sidebar:"root",previous:{title:"ReauthenticateOptions",permalink:"/authgear-sdk-js/docs/web/interfaces/ReauthenticateOptions"},next:{title:"SettingOptions",permalink:"/authgear-sdk-js/docs/web/interfaces/SettingOptions"}},c={},p=[{value:"Table of contents",id:"table-of-contents",level:2},{value:"Properties",id:"properties",level:3},{value:"Properties",id:"properties-1",level:2},{value:'<a id="state" name="state"></a> state',id:"-state",level:3},{value:"Defined in",id:"defined-in",level:4},{value:'<a id="userinfo" name="userinfo"></a> userInfo',id:"-userinfo",level:3},{value:"Defined in",id:"defined-in-1",level:4}],f={toc:p};function d(e){var t=e.components,n=(0,a.Z)(e,o);return(0,i.kt)("wrapper",(0,r.Z)({},f,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/web"},"@authgear/web")," / ReauthenticateResult"),(0,i.kt)("h1",{id:"interface-reauthenticateresult"},"Interface: ReauthenticateResult"),(0,i.kt)("p",null,"Result of reauthentication"),(0,i.kt)("h2",{id:"table-of-contents"},"Table of contents"),(0,i.kt)("h3",{id:"properties"},"Properties"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/web/interfaces/ReauthenticateResult#state"},"state")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"/authgear-sdk-js/docs/web/interfaces/ReauthenticateResult#userinfo"},"userInfo"))),(0,i.kt)("h2",{id:"properties-1"},"Properties"),(0,i.kt)("h3",{id:"-state"},(0,i.kt)("a",{id:"state",name:"state"})," state"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,i.kt)("strong",{parentName:"p"},"state"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"OAuth 2.0 state value."),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,"packages/authgear-web/index.d.ts:386"),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"-userinfo"},(0,i.kt)("a",{id:"userinfo",name:"userinfo"})," userInfo"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"userInfo"),": ",(0,i.kt)("a",{parentName:"p",href:"/authgear-sdk-js/docs/web/interfaces/UserInfo"},(0,i.kt)("inlineCode",{parentName:"a"},"UserInfo"))),(0,i.kt)("p",null,"UserInfo."),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,"packages/authgear-web/index.d.ts:390"))}d.isMDXComponent=!0}}]);