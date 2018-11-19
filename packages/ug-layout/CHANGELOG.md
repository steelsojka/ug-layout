# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="4.2.5"></a>
## [4.2.5](https://github.com/steelsojka/ug-layout/compare/v4.2.4...v4.2.5) (2018-11-19)


### Bug Fixes

* **ViewContainer:** add new cache strategy for RELOAD only ([64e031f](https://github.com/steelsojka/ug-layout/commit/64e031f))



<a name="4.2.4"></a>
## [4.2.4](https://github.com/steelsojka/ug-layout/compare/v4.2.2...v4.2.4) (2018-11-19)


### Bug Fixes

* **AngularViewFactoryt:** unbind inputs on destroy ([c67d379](https://github.com/steelsojka/ug-layout/commit/c67d379))
* **view:** proxy correct view container property ([9ff202a](https://github.com/steelsojka/ug-layout/commit/9ff202a))
* **ViewContainer:** only cache RELOAD on RESET context ([ff4050a](https://github.com/steelsojka/ug-layout/commit/ff4050a))



<a name="4.2.3"></a>
## [4.2.3](https://github.com/steelsojka/ug-layout/compare/v4.2.2...v4.2.3) (2018-09-10)


### Bug Fixes

* **AngularViewFactoryt:** unbind inputs on destroy ([c67d379](https://github.com/steelsojka/ug-layout/commit/c67d379))
* **view:** proxy correct view container property ([9ff202a](https://github.com/steelsojka/ug-layout/commit/9ff202a))



<a name="4.2.2"></a>
## [4.2.2](https://github.com/steelsojka/ug-layout/compare/v4.2.1...v4.2.2) (2018-06-14)


### Bug Fixes

* **events:** fix breaking cancellable events ([2c819c0](https://github.com/steelsojka/ug-layout/commit/2c819c0))



<a name="4.2.1"></a>
## [4.2.1](https://github.com/steelsojka/ug-layout/compare/v4.2.0...v4.2.1) (2018-06-13)


### Bug Fixes

* **angular:** complete outputs on destroy ([9f8a022](https://github.com/steelsojka/ug-layout/commit/9f8a022))
* **events:** fix Cancellable error handling ([4980f4c](https://github.com/steelsojka/ug-layout/commit/4980f4c))



<a name="4.2.0"></a>
# [4.2.0](https://github.com/steelsojka/ug-layout/compare/v4.0.2...v4.2.0) (2018-04-11)


### Bug Fixes

* **testability:** clear pending when layout switches ([a6ff9f6](https://github.com/steelsojka/ug-layout/commit/a6ff9f6))
* **testability:** don't use testability by default ([596644e](https://github.com/steelsojka/ug-layout/commit/596644e))
* **Testability:** fix condition ([6eb2c18](https://github.com/steelsojka/ug-layout/commit/6eb2c18))
* **ViewContainer:** revert attached subject change ([57fef8b](https://github.com/steelsojka/ug-layout/commit/57fef8b))


### Features

* **Renderable:** allow for querying a parent ([f95735f](https://github.com/steelsojka/ug-layout/commit/f95735f))
* **ViewManager:** add register apis ([814fafa](https://github.com/steelsojka/ug-layout/commit/814fafa))



<a name="4.0.2"></a>
## [4.0.2](https://github.com/steelsojka/ug-layout/compare/v4.0.1...v4.0.2) (2018-01-05)



<a name="4.0.1"></a>
## [4.0.1](https://github.com/steelsojka/ug-layout/compare/v4.0.0...v4.0.1) (2018-01-02)



<a name="4.0.0"></a>
# [4.0.0](https://github.com/steelsojka/ug-layout/compare/v3.2.8...v4.0.0) (2018-01-02)


### Features

* **injector:** add overridable ViewContainer in injector ([5489767](https://github.com/steelsojka/ug-layout/commit/5489767))
* **injector:** allow overriding of builtin classes ([7663ca9](https://github.com/steelsojka/ug-layout/commit/7663ca9))



<a name="3.2.8"></a>
## [3.2.8](https://github.com/steelsojka/ug-layout/compare/v2.0.1...v3.2.8) (2017-08-22)


### Bug Fixes

* **dom:** add Transferable API for transferring config properties ([ac82b16](https://github.com/steelsojka/ug-layout/commit/ac82b16))
* **factory:** allow configurable resolve hook ([2f84e22](https://github.com/steelsojka/ug-layout/commit/2f84e22))
* **factory:** mark change detector for detection ([a7dcaba](https://github.com/steelsojka/ug-layout/commit/a7dcaba))
* **factory:** wait for ngOnInit before component is ready ([a4d8bb3](https://github.com/steelsojka/ug-layout/commit/a4d8bb3))
* **StackItemContainer:** remove check for existing container ([de539c5](https://github.com/steelsojka/ug-layout/commit/de539c5))
* **stackTab:** allow excluding from drop target calculations ([c1d2927](https://github.com/steelsojka/ug-layout/commit/c1d2927))
* **stackTab:** don't allow dragging if there are no targets ([99e5386](https://github.com/steelsojka/ug-layout/commit/99e5386))
* **styles:** icon class only apply to styles and not font ([4628e3f](https://github.com/steelsojka/ug-layout/commit/4628e3f))
* **View:** add minimize argument for toggle ([222e280](https://github.com/steelsojka/ug-layout/commit/222e280))
* **View:** check for existing ATTACHED views before skipping insert ([fcfe421](https://github.com/steelsojka/ug-layout/commit/fcfe421))
* **ViewContainer:** caching should be read from the view container ([c51eb9f](https://github.com/steelsojka/ug-layout/commit/c51eb9f))
* **ViewLinker:** don't insert view if it exists already ([7550bd4](https://github.com/steelsojka/ug-layout/commit/7550bd4))
* **XYContainer:** disable splitter when items min/max are equal ([eb52d79](https://github.com/steelsojka/ug-layout/commit/eb52d79))
* **XYContainer:** minimize initialing to correct value on load ([d9ce404](https://github.com/steelsojka/ug-layout/commit/d9ce404))


### Features

* **Angular1ComponentFactory:** add $doCheck lifecycle hook support ([d476dab](https://github.com/steelsojka/ug-layout/commit/d476dab))
* **dom:** export snabbdom utils ([3f11771](https://github.com/steelsojka/ug-layout/commit/3f11771))
* **Renderable:** ability to get leaf nodes and elements on views ([a37c33c](https://github.com/steelsojka/ug-layout/commit/a37c33c))
* **view:** allow view resolve to return list ([319a966](https://github.com/steelsojka/ug-layout/commit/319a966))
* **View:** add link metadata extension ([08f77a2](https://github.com/steelsojka/ug-layout/commit/08f77a2))
* **ViewLinker:** add unlink decorator to view linker ([be5cce8](https://github.com/steelsojka/ug-layout/commit/be5cce8))
