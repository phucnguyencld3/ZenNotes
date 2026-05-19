import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import path from 'node:path';

type PrismaClientCtor = typeof import('../../generated/prisma').PrismaClient;

// NOTE: Prisma client is generated to ./generated/prisma (custom output).
// When Nest compiles to dist/, relative imports would point to dist/generated.
// Requiring from process.cwd() keeps it stable for dev and prod.
const { PrismaClient } = require(path.join(process.cwd(), 'generated/prisma')) as {
  PrismaClient: PrismaClientCtor;
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
