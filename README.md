# vuex-module-decorators-state

Allows injecting state directory to component by [decorator](https://github.com/championswimmer/vuex-module-decorators/issues/191)
Generics bellow ensure that this decorator can be only applied to the same type as vuexModule support

Check [vue-webpack-typescript](https://github.com/akoidan/vue-webpack-typescript) project for example.
 
Let's say you have defined your vuex-module like this:


**types.ts**:
```typescript
export interface Branch {
  "name": string;
}

export interface IGithubState {
  branch: Branch;
}

export interface IRootState {
  github: IGithubState;
}
```

**store.ts**:
```typescript
import Vuex, {Store} from "vuex";
import Vue from "vue";
import {Branch, IGithubState, IRootState} from "@/types";
import {Module, Mutation, VuexModule, getModule} from "vuex-module-decorators";
import {stateDecoratorFactory} from 'vuex-module-decorators-state'

Vue.use(Vuex);

const store: Store<IRootState> = new Store<IRootState>({});

@Module({
  dynamic: true,
  name: "github",
  store,
})
class GithubModule extends VuexModule implements IGithubState {
  public branch: Branch = {name: "Master branch"};
}

const githubModule: GithubModule = getModule(GithubModule);

/*
 * TPN - TypePropertyName
 * TCT - TypeConsumerType
 * the generics bellow are inherited strictly from stateDecoratorFactory, see its docs
 */
const GithubState: <TCT extends (TCT[TPN] extends GithubModule[TPN] ? unknown : never),
  TPN extends (keyof TCT & keyof GithubModule)>(vueComponent: TCT, fileName: TPN) => void =
    stateDecoratorFactory(githubModule);

export {GithubState, githubModule};
```

## And use it everywhere in your vue Components:
```vue
<template>
 <div>
  {{branch.name}}
</div>
</template>
<script lang="ts">
  import {Component, Vue} from "vue-property-decorator";
  import {GithubState} from "@/store";
  import {Branch} from "@/types";
  
  @Component
  export default class RepoBranches extends Vue {
  
    @GithubState
    public readonly branch!: Branch;
  }
</script>
```

If you do

```typescript
import {GithubState} from "@/store";
import {Branch} from "@/types";

class RepoBranches extends Vue  {
    @GithubState
    // Results typescript compilation error because state doesn't exist
    public readonly notExistedState!: Branch;
  
    @GithubState
    // Results typescript compilation error, because type mismatch
    public readonly branch!: string;
}
```
