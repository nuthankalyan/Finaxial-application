export enum RelationType {
  ONE_TO_ONE = 'ONE_TO_ONE',
  ONE_TO_MANY = 'ONE_TO_MANY',
  MANY_TO_ONE = 'MANY_TO_ONE',
  MANY_TO_MANY = 'MANY_TO_MANY'
}

export interface Relationship {
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
  type: RelationType;
  through?: {
    tableName: string;
    fromField: string;
    toField: string;
  };
}
