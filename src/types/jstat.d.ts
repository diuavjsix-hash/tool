declare module 'jstat' {
  interface StudentTDistribution {
    pdf(value: number, degrees: number): number
    cdf(value: number, degrees: number): number
    inv(probability: number, degrees: number): number
  }

  export const jStat: {
    studentt: StudentTDistribution
  }
}
