import * as bcrypt from 'bcrypt';
const saltOrRounds = 7;

export const hashPw = async (pw: string) => await bcrypt.hash(pw, saltOrRounds);

export const comparePw = async (pw1: string, pw2: string) =>
  await bcrypt.compare(pw1, pw2);
