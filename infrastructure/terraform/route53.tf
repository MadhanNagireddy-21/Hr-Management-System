resource "aws_route53_zone" "primary" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name

  tags = {
    Name    = "${var.project_name}-dns-zone"
    Project = var.project_name
  }
}

resource "aws_route53_record" "frontend_alias" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.primary[0].zone_id
  name    = "hrms.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [aws_cloudfront_distribution.frontend.domain_name]
}

resource "aws_route53_record" "api_a_record" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.primary[0].zone_id
  name    = "api.${var.domain_name}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.app_server_eip.public_ip]
}
