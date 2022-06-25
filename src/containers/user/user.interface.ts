export interface User {
  id: number;
  username: string;
  password: string;
}

export interface UserCreationDTO {
  username: string;
  password: string;
}
