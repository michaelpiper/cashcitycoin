export enum RedisDatabase{
    DEVELOPEMENT=0,
    STAGING=1,
    PRODUCTION=3,
}
export enum TransactionStatus{
    PENDING="pending",
    FAILED ="failed",
    VERIFYING = "verifying",
    COMPLETED ="completed",
}

export enum MiningStatus{
    PENDING="pending",
    FAILED ="failed",
    COMPLETED ="completed",
}