
import winston from "winston";

export const log = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console({
      stderrLevels: ["info"],
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
      ),
    }),
  ],
});
