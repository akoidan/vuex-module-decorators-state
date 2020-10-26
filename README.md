# vuex-module-decorators-state
[![HitCount](http://hits.dwyl.com/akoidan/vuex-module-decorators-state.svg)](http://hits.dwyl.com/akoidan/vuex-module-decorators-state) ![npm](https://img.shields.io/npm/v/vuex-module-decorators-state)

You need this package if you use:
 - Vue2
 - Typescript
 - vue-class-component or vue-property-decorator
 - vuex-module-decorators
 
This packages adds easy lifehack to maintype strong typing and easy integration for injecting vuex state to vue class-based component. Check [this issue](https://github.com/championswimmer/vuex-module-decorators/issues/191)

## Example
Want to inject your state like this with typesafe?

```typescript
    @State
    public readonly user!: user;
```

Check this [vue-webpack-typescript](https://github.com/akoidan/vue-webpack-typescript) or follow the example bellow.

## Install 
```bash
yarn add vuex-module-decorators-state
```
 
## How to use?

1. Extract common vuex-module-decorator interfaces into a separate file, let's say **types.ts**:

```typescript
// Typescript type of the state you want to inject
export interface Branch {
  "name": string;
}
// Root vuex store.
export interface IRootState {
  github: IGithubState;
}

// Store module you want to inject. If you have only single store module. You won't need interface above
export interface IGithubState {
  branch: Branch;
}
```

2. Create your store:

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

export const githubModule: GithubModule = getModule(GithubModule);

```
3. Create decorator with factory method by passing githubModule:
```typescript
export const GithubState = stateDecoratorFactory(githubModule);
```
You don't need to declare type of the var in order for typescript to give you compilation errors if type missmatches. But if you want to have types, there you go:

```typescript
export const GithubState: <TCT extends (TCT[TPN] extends GithubModule[TPN] ? unknown : never),
  TPN extends (keyof TCT & keyof GithubModule)>(vueComponent: TCT, fileName: TPN) => void =
    stateDecoratorFactory(githubModule);
```

4. Apply decorator anywhere in your components:
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
