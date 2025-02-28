import { decodeTuple, encodeTuple } from '$lib/worker/config'
import { derived, type Invalidator, type Readable, readable, type Subscriber, type Updater, type Writable, writable } from 'svelte/store'

const ANGLE_MULT = Math.PI / 180 / 45

export class TupleBaseStore {
  public t0: Writable<number>
  public t1: Writable<number>
  public t2: Writable<number>
  public t3: Writable<number>
  public tuple: Readable<bigint>

  private values: [number, number, number, number]
  private updating = true

  constructor(initial: bigint) {
    let [v0, v1, v2, v3] = this.transformFrom(...decodeTuple(initial))
    this.values = [v0, v1, v2, v3]
    this.t0 = writable<number>(v0)
    this.t1 = writable<number>(v1)
    this.t2 = writable<number>(v2)
    this.t3 = writable<number>(v3)
    const tupleWriter = writable<bigint>(initial)
    this.tuple = tupleWriter

    const onChange = (handler: (v: number) => void) => (v: number) => {
      handler(v)
      if (!this.updating) tupleWriter.set(encodeTuple(this.transformInto(...this.values).map(v => Math.round(v))))
    }

    this.t0.subscribe(onChange(v => this.values[0] = v))
    this.t1.subscribe(onChange(v => this.values[1] = v))
    this.t2.subscribe(onChange(v => this.values[2] = v))
    this.t3.subscribe(onChange(v => this.values[3] = v))
  }

  public components() {
    return [this.t0, this.t1, this.t2, this.t3]
  }

  public update(b: bigint) {
    let [v0, v1, v2, v3] = this.transformFrom(...decodeTuple(b))
    this.updating = true
    this.t0.set(v0)
    this.t1.set(v1)
    this.t2.set(v2)
    this.t3.set(v3)
    this.updating = false
    ;(this.tuple as Writable<bigint>).set(b)
  }

  /** exported components -> value written to tuple */
  protected transformInto(v0: number, v1: number, v2: number, v3: number): [number, number, number, number] {
    return [v0, v1, v2, v3]
  }

  /** Values extracted from tuple -> exported components */
  protected transformFrom(v0: number, v1: number, v2: number, v3: number): [number, number, number, number] {
    return [v0, v1, v2, v3]
  }
}

export class TupleStore extends TupleBaseStore {
  constructor(initial: bigint, private divisor = 10, private zxy = false) {
    super(initial)
  }

  protected transformInto(v0: number, v1: number, v2: number, v3: number): [number, number, number, number] {
    let [x, y, z, a] = [v0, v1, v2, v3].map(v => v * this.divisor)
    if (this.zxy) [x, y, z] = ZXYtoZYX(x, y, z)
    return [x, y, z, a]
  }

  protected transformFrom(v0: number, v1: number, v2: number, v3: number): [number, number, number, number] {
    if (this.zxy) [v0, v1, v2] = ZYXtoZXY(v0, v1, v2)
    return [v0 / this.divisor, v1 / this.divisor, v2 / this.divisor, v3 / this.divisor]
  }
}

export function ZYXtoZXY(x: number, y: number, z: number) {
  // Based on the handy conversion table on Wikipedia:
  //  https://en.wikipedia.org/wiki/Euler_angles#Rotation_matrix
  // a, b, y are the parameters for the ZYX ordering
  // these are used to calculate R12, R22, R32, etc.
  // then I plug these matrix elements into the YXY decomposition.
  const ca = Math.cos(z * ANGLE_MULT), cb = Math.cos(y * ANGLE_MULT), cy = Math.cos(x * ANGLE_MULT)
  const sa = Math.sin(z * ANGLE_MULT), sb = Math.sin(y * ANGLE_MULT), sy = Math.sin(x * ANGLE_MULT)
  let angles: [number, number, number] = [
    Math.asin(cb * sy) / ANGLE_MULT,
    Math.atan(sb / (cb * cy)) / ANGLE_MULT,
    Math.atan((cy * sa - ca * sb * sy) / (ca * cy + sa * sb * sy)) / ANGLE_MULT,
  ]
  // if (z * angles[2] < 0) angles = angles.map(x => -x) as any
  return angles
}

export function ZXYtoZYX(x: number, y: number, z: number) {
  // Based on the handy conversion table on Wikipedia:
  //  https://en.wikipedia.org/wiki/Euler_angles#Rotation_matrix
  // a, b, y are the parameters for the ZXY ordering
  // these are used to calculate R12, R22, R32, etc.
  // then I plug these matrix elements into the YXY decomposition.
  const ca = Math.cos(z * ANGLE_MULT), cb = Math.cos(x * ANGLE_MULT), cy = Math.cos(y * ANGLE_MULT)
  const sa = Math.sin(z * ANGLE_MULT), sb = Math.sin(x * ANGLE_MULT), sy = Math.sin(y * ANGLE_MULT)
  let angles: [number, number, number] = [
    Math.atan(sb / (cb * cy)) / ANGLE_MULT,
    Math.asin(cb * sy) / ANGLE_MULT,
    Math.atan((cy * sa + ca * sb * sy) / (ca * cy - sa * sb * sy)) / ANGLE_MULT,
  ]
  // if (z * angles[2] < 0) angles = angles.map(x => -x) as any
  return angles
}

class WritableMux<T> implements Writable<T> {
  private store: Writable<T>

  private _choice: boolean = undefined as any
  private _a: T = undefined as any
  private _b: T = undefined as any

  constructor(initial: T, choice: Readable<boolean>, private a: Writable<T>, private b: Writable<T>) {
    this.store = writable(initial)
    a.subscribe(a => {
      this._a = a
      if (!this._choice) this.store.set(a)
    })
    b.subscribe(b => {
      this._b = b
      if (this._choice) this.store.set(b)
    })
    choice.subscribe(choice => {
      this._choice = choice
      this.store.set(this._choice ? this._b : this._a)
    })
  }

  set(val: T) {
    if (this._choice) this.b.set(val)
    else this.a.set(val)
  }

  update(updater: Updater<T>): void {
    this.set(updater(this._choice ? this._b : this._a))
  }

  subscribe(run: Subscriber<T>, invalidate?: Invalidator<T> | undefined) {
    return this.store.subscribe(run, invalidate)
  }
}

export class TupleMux {
  private t0: Writable<number>
  private t1: Writable<number>
  private t2: Writable<number>
  private t3: Writable<number>
  public tuple: Readable<bigint>

  constructor(choice: Readable<boolean>, private aStore: TupleBaseStore, private bStore: TupleBaseStore) {
    const [r0, r1, r2, r3] = this.aStore.components()
    const [a0, a1, a2, a3] = this.bStore.components()

    this.t0 = new WritableMux(-1, choice, r0, a0)
    this.t1 = new WritableMux(-1, choice, r1, a1)
    this.t2 = new WritableMux(-1, choice, r2, a2)
    this.t3 = new WritableMux(-1, choice, r3, a3)
    this.tuple = derived([this.aStore.tuple, this.bStore.tuple, choice], ([a, b, c]) => c ? b : a)
  }

  public components() {
    return [this.t0, this.t1, this.t2, this.t3]
  }

  public update(b: bigint) {
    this.aStore.update(b)
    this.bStore.update(b)
  }
}
