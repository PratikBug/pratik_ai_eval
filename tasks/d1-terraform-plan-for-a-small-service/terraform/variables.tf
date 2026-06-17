variable "project_name" {
  description = "Short name prefix for resources."
  type        = string
  default     = "d1-mini"
}

variable "environment" {
  description = "Deployment environment label (e.g. dev, local)."
  type        = string
  default     = "local"
}

variable "aws_region" {
  description = "AWS region used by the provider."
  type        = string
  default     = "us-east-1"
}

variable "use_localstack" {
  description = "When true, point the AWS provider at LocalStack instead of real AWS."
  type        = bool
  default     = true
}

variable "localstack_endpoint" {
  description = "Base URL for LocalStack (all service endpoints)."
  type        = string
  default     = "http://127.0.0.1:4566"
}
