import Vue from "vue";

type AlertType = "success" | "info" | "error";

type ClassType = new <T extends Vue>(...args: unknown[]) => unknown;
type ValueFilterForKey<T extends InstanceType<ClassType>, U> = {
  [K in keyof T]: U extends T[K] ? K : never;
}[keyof T];

interface AlertModel {
  id: number;
  text: string;
  type: AlertType;
}

const getUniqueId = ((): () => number => {
  let id = 1;
  return (): number => id++;
})();


/**
 * Wraps vue component with `with` block, that wraps the function and does:
 *  - Triggers loading state to true on start, and false on finish
 *  - Sets error message if it occurs
 *
 *  Example:
 *  ```typescript
 *  class MyComp extends Vue {
 *    public serverError: string = ""; // this would result an error string
 *    public loading: boolean = false; // this would turn to true on start, and to false on finish
 *
 *    @HandleLoading({errPropNameOrCB: "serverError", loadingPropName: "loading"})
 *    private async submitForm(): Promise<void> {
 *      // do some action
 *    }
 *  }
 *  ```
 * @param loadingPropName: field of target class that will be assigned to true when this function starts executing
 * @param errPropNameOrCB: field of target class which would be assined to error if it occurs
 */
function HandleLoading<T extends InstanceType<ClassType>>({loadingPropName, errPropNameOrCB}: {
  loadingPropName: ValueFilterForKey<T, boolean>;
  errPropNameOrCB: ValueFilterForKey<T, AlertModel|null> | ValueFilterForKey<T, (error: string) => void>
}) {

  /**
   * Processes all error cases from HandleLoading
   * Sets the state to an error if possible, otherwise rethrows it.
   */
  // istanbul ignore next
  function processError<T>(
      target: T,
      error: Error|undefined,
      vueProperty: string | ((error: string) => void)
  ): void {
    if ((target as any).$logger) {
      (target as any).$logger.error("Action error {}", error)();
    } else {
      console.error("Action error", error)
    }
    const text: string = String(error ? error.message : error);

    if (typeof vueProperty === "string") {
      const alert: AlertModel = {
        id: getUniqueId(),
        text,
        type: "error",
      };
      target[vueProperty] = alert;
    } if (typeof vueProperty === 'function') {
        vueProperty(text);
    } else {
      throw Error(text);
    }
  }


  return function( // eslint-disable-line func-names
      target: T,
      propertyKey: string,
      descriptor: PropertyDescriptor,
  ): void {
    const original = descriptor.value;
    descriptor.value = async function(this: T, ...args: unknown[]): Promise<void> { // eslint-disable-line func-names
      try {
        // istanbul ignore if
        if (this[loadingPropName]) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
          if ((this as any).$logger) {
            (this as any).$logger.warn("Skipping {} as it's loading", descriptor.value)();
          } else {
            console.warn("Skipping", descriptor.value ,"as it's loading'");
          }
          return;
        }
        // istanbul ignore else
        if (loadingPropName) {
          (this[loadingPropName] as never as boolean) = true;
        }
        await original.apply(this, args);
          // istanbul ignore else
          if (typeof errPropNameOrCB === "string") {
            this[errPropNameOrCB] = null;
          }
        } catch (err) {
          processError<T>(this, err, errPropNameOrCB as never);
        } finally {
        // istanbul ignore else
        if (loadingPropName) {
          (this[loadingPropName] as never as boolean) = false;
        }
      }
    };
  };
}


export {HandleLoading, AlertModel, AlertType, getUniqueId}
